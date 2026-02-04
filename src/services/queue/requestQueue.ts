import { READ_TIMEOUT, WRITE_TIMEOUT } from "../../config/constants";
import { QueueItem, BatchOperation, QueueSubscriber } from "../../types";

export class RequestQueue {
  private queue: Map<string, QueueItem> = new Map();
  private readBatchTimer: NodeJS.Timeout | null = null;
  private writeBatchTimer: NodeJS.Timeout | null = null;
  private pendingReadBatch: BatchOperation | null = null;
  private pendingWriteBatch: BatchOperation | null = null;

  private generateKey(action: string, data?: any): string {
    if (data?.id) {
      return `${action}_${data.id}`;
    }
    if (data?.ids && Array.isArray(data.ids)) {
      return `${action}_${data.ids.sort().join("_")}`;
    }
    if (data?.filter !== undefined) {
      return `${action}_filter_${data.filter}_${data.offset || 0}_${data.limit || 20}`;
    }
    return `${action}_${JSON.stringify(data)}`;
  }

  // Определяем тип операции
  private getOperationType(action: QueueItem["action"]): "READ" | "WRITE" {
    const readOperations: QueueItem["action"][] = ["GET_ALL", "GET_SELECTED"];
    return readOperations.includes(action) ? "READ" : "WRITE";
  }

  // Добавление операции в очередь с дедупликацией
  public enqueue<T>(action: QueueItem["action"], data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const key = this.generateKey(action, data);
      const type = this.getOperationType(action);
      const subscriber: QueueSubscriber = {
        resolve,
        reject,
        subscribedAt: Date.now(),
      };

      // Дедупликация для READ операций
      if (type === "READ" && this.queue.has(key)) {
        const existing = this.queue.get(key)!;

        // Добавляем нового подписчика к существующему элементу
        // Таким образом, когда придет результат, получат все подписчики
        existing.subscribers.push(subscriber);
        existing.timestamp = Date.now();

        return; // Промис разрешится когда выполнится batch
      }
      // Дедупликация для WRITE операций
      else if (type === "WRITE" && this.queue.has(key)) {
        // Для WRITE операций дублирование не допускается сразу разрешаем промис с информацией о дубликате
        resolve({
          success: true,
          message: "Добавление дубликата проигнорировано",
          timestamp: Date.now(),
        } as any);

        return;
        // НОВАЯ ОПЕРАЦИЯ (первый раз видим такой ключ)
      } else {
        // Создаем новый элемент очереди
        const queueItem: QueueItem = {
          id: key,
          action,
          data,
          timestamp: Date.now(), // Время создания
          subscribers: [subscriber], // ✅ Массив с первым подписчиком
          type,
        };

        // Добавляем в очередь
        this.queue.set(key, queueItem);

        // Планируем выполнение в зависимости от типа
        if (type === "READ") {
          this.scheduleReadBatch(); // Выполнится через READ_TIMEOUT
        } else {
          this.scheduleWriteBatch(); // Выполнится через WRITE_TIMEOUT
        }
      }
    });
  }

  // Планирование батча для чтения (раз в секунду)
  private scheduleReadBatch(): void {
    if (this.readBatchTimer) return;

    this.readBatchTimer = setTimeout(() => {
      this.executeReadBatch();
    }, READ_TIMEOUT);
  }

  // Планирование батча для записи (раз в 10 секунд)
  private scheduleWriteBatch(): void {
    if (this.writeBatchTimer) return;

    this.writeBatchTimer = setTimeout(() => {
      this.executeWriteBatch();
    }, WRITE_TIMEOUT);
  }

  // Выполнение батча чтения (только GET операции)
  private async executeReadBatch(): Promise<void> {
    const readItems = Array.from(this.queue.values()).filter(
      (item) => item.type === "READ",
    );

    if (readItems.length === 0) {
      this.readBatchTimer = null;
      return;
    }

    this.pendingReadBatch = {
      type: "READ",
      items: readItems,
      executeTime: Date.now(),
    };

    // Удаляем обработанные READ операции из очереди
    readItems.forEach((item) => this.queue.delete(item.id));

    // Выполняем операции чтения
    await this.processReadBatch(this.pendingReadBatch);

    this.pendingReadBatch = null;
    this.readBatchTimer = null;

    // Если остались READ операции, планируем следующий батч
    const hasPendingReads = Array.from(this.queue.values()).some(
      (item) => item.type === "READ",
    );

    if (hasPendingReads) {
      this.scheduleReadBatch();
    }
  }

  // Выполнение батча записи (только WRITE операции)
  private async executeWriteBatch(): Promise<void> {
    const writeItems = Array.from(this.queue.values()).filter(
      (item) => item.type === "WRITE",
    );

    if (writeItems.length === 0) {
      this.writeBatchTimer = null;
      return;
    }

    this.pendingWriteBatch = {
      type: "WRITE",
      items: writeItems,
      executeTime: Date.now(),
    };

    // Удаляем обработанные WRITE операции из очереди
    writeItems.forEach((item) => this.queue.delete(item.id));

    // Выполняем операции записи
    await this.processWriteBatch(this.pendingWriteBatch);

    this.pendingWriteBatch = null;
    this.writeBatchTimer = null;

    // Если остались WRITE операции, планируем следующий батч
    const hasPendingWrites = Array.from(this.queue.values()).some(
      (item) => item.type === "WRITE",
    );

    if (hasPendingWrites) {
      this.scheduleWriteBatch();
    }
  }

  // Обработка батча чтения (будет переопределена)
  protected async processReadBatch(batch: BatchOperation): Promise<void> {
    console.log(`Обработка батча чтения с ${batch.items.length} элементами`);

    // Обрабатываем каждый уникальный запрос
    batch.items.forEach((item: QueueItem) => {
      // Разрешаем промисы ВСЕХ подписчиков
      item.subscribers.forEach((subscriber) => {
        subscriber.resolve({
          message: "Операция чтения обработана",
          count: batch.items.length,
        });
      });
    });
  }

  // Обработка батча записи (будет переопределена)
  protected async processWriteBatch(batch: BatchOperation): Promise<void> {
    // Заглушка - реализация в наследнике
    console.log(`Обработка батча чтения с ${batch.items.length} элементами`);
    batch.items.forEach((item: QueueItem) => {
      // Разрешаем промисы ВСЕХ подписчиков
      item.subscribers.forEach((subscriber) => {
        subscriber.resolve({
          message: "Операция записи обработана",
          count: batch.items.length,
        });
      });
    });
  }

  public getStats() {
    const allItems = Array.from(this.queue.values());
    return {
      queueSize: this.queue.size,
      readOperations: allItems.filter((item) => item.type === "READ").length,
      writeOperations: allItems.filter((item) => item.type === "WRITE").length,
      pendingReadBatch: this.pendingReadBatch?.items.length || 0,
      pendingWriteBatch: this.pendingWriteBatch?.items.length || 0,
    };
  }
}
