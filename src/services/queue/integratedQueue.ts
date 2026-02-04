import { PAGINATION } from "../../config/constants";
import { DataStore } from "../../models/dataStore";
import {
  BatchOperation,
  PaginatedResponse,
  Item,
  SelectedItemsResponse,
  AddSelectedResult,
  UpdateOrderResult,
  RemoveSelectedResult,
} from "../../types";
import { RequestQueue } from "./requestQueue";

/**
 * Интегрированная очередь для работы с DataStore
 * Наследуется от RequestQueue и переопределяет методы обработки батчей
 */
export class IntegratedQueue extends RequestQueue {
  private dataStore: DataStore;

  constructor(dataStore: DataStore) {
    super();
    this.dataStore = dataStore;
  }

  /**
   * Переопределяем обработку READ батчей
   * Обрабатываем GET_ALL и GET_SELECTED операции
   */
  protected async processReadBatch(batch: BatchOperation): Promise<void> {
    console.log(
      `[IntegratedQueue] Обработка READ батча: ${batch.items.length} операций`,
    );

    // Обрабатываем каждый уникальный запрос
    for (const item of batch.items) {
      try {
        let result: any;

        switch (item.action) {
          case "GET_ALL":
            result = await this.handleGetAll(item.data);
            break;

          case "GET_SELECTED":
            result = await this.handleGetSelected(item.data);
            break;

          default:
            throw new Error(`Неизвестная READ операция: ${item.action}`);
        }

        // Уведомляем всех подписчиков об успехе
        item.subscribers.forEach((subscriber) => {
          subscriber.resolve(result);
        });

        console.log(
          `[IntegratedQueue] ${item.action} выполнена для ${item.subscribers.length} подписчиков`,
        );
      } catch (error) {
        // Уведомляем всех подписчиков об ошибке
        item.subscribers.forEach((subscriber) => {
          subscriber.reject(error);
        });

        console.error(
          `[IntegratedQueue] Ошибка при выполнении ${item.action}:`,
          error,
        );
      }
    }
  }

  /**
   * Переопределяем обработку WRITE батчей
   * Обрабатываем ADD_ITEM, UPDATE_ORDER, REMOVE_ITEM операции
   */
  protected async processWriteBatch(batch: BatchOperation): Promise<void> {
    console.log(
      `[IntegratedQueue] Обработка WRITE батча: ${batch.items.length} операций`,
    );

    // Обрабатываем каждый уникальный запрос
    for (const item of batch.items) {
      try {
        let result: any;

        switch (item.action) {
          case "ADD_ITEM":
            result = await this.handleAddItem(item.data);
            break;

          case "UPDATE_ORDER":
            result = await this.handleUpdateOrder(item.data);
            break;

          case "REMOVE_ITEM":
            result = await this.handleRemoveItem(item.data);
            break;

          default:
            throw new Error(`Неизвестная WRITE операция: ${item.action}`);
        }

        item.subscribers.forEach((subscriber) => {
          subscriber.resolve(result);
        });

        console.log(
          `[IntegratedQueue] ${item.action} выполнена для ${item.subscribers.length} подписчиков`,
        );
      } catch (error) {
        item.subscribers.forEach((subscriber) => {
          subscriber.reject(error);
        });

        console.error(
          `[IntegratedQueue] Ошибка при выполнении ${item.action}:`,
          error,
        );
      }
    }
  }

  /**
   * Получение всех элементов с пагинацией и фильтрацией
   */
  private async handleGetAll(data?: {
    offset?: number;
    limit?: number;
    filter?: string;
  }): Promise<PaginatedResponse<Item>> {
    const offset = data?.offset ?? PAGINATION.DEFAULT_OFFSET;
    const limit = Math.min(
      data?.limit ?? PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT,
    );
    const filter = data?.filter?.toLowerCase() || "";

    // Получаем все элементы
    let allItems = this.dataStore.getAllItems();

    // Применяем фильтр если есть
    if (filter) {
      allItems = allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(filter) ||
          item.description.toLowerCase().includes(filter) ||
          item.category.toLowerCase().includes(filter),
      );
    }

    const total = allItems.length;
    const data_items = allItems.slice(offset, offset + limit);

    return {
      data: data_items,
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Получение выбранных элементов с пагинацией
   */
  private async handleGetSelected(data?: {
    offset?: number;
    limit?: number;
  }): Promise<SelectedItemsResponse> {
    const offset = data?.offset ?? PAGINATION.DEFAULT_OFFSET;
    const limit = Math.min(
      data?.limit ?? PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT,
    );

    // Получаем выбранные ID
    const selectedIds = this.dataStore.getSelectedItems();
    const total = selectedIds.length;

    // Пагинация выбранных ID
    const paginatedIds = selectedIds.slice(offset, offset + limit);

    // Получаем данные элементов
    const items = this.dataStore.getItemsByIds(paginatedIds);

    return {
      data: items,
      selectedIds: selectedIds, // Все выбранные ID (не пагинированные)
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Добавление элементов в выбранные
   */
  private async handleAddItem(data: {
    ids: number[];
  }): Promise<AddSelectedResult> {
    const { ids } = data;

    // Валидация: все ID должны существовать
    const nonExistentIds = ids.filter((id) => !this.dataStore.itemExists(id));
    if (nonExistentIds.length > 0) {
      throw new Error(
        `Элементы с ID ${nonExistentIds.join(", ")} не существуют`,
      );
    }

    // Добавляем в выбранные
    const { newIds, duplicateIds } = this.dataStore.addSelectedItems(ids);

    return {
      message:
        newIds.length > 0
          ? `Добавлено ${newIds.length} элементов`
          : "Все элементы уже были выбраны",
      added: newIds,
      duplicates: duplicateIds,
      totalSelected: this.dataStore.getSelectedItems().length,
    };
  }

  /**
   * Обновление порядка выбранных элементов
   */
  private async handleUpdateOrder(data: {
    ids: number[];
  }): Promise<UpdateOrderResult> {
    const { ids } = data;

    // Валидация: все ID должны быть в выбранных
    const currentSelected = new Set(this.dataStore.getSelectedItems());
    const invalidIds = ids.filter((id) => !currentSelected.has(id));

    if (invalidIds.length > 0) {
      throw new Error(
        `Элементы с ID ${invalidIds.join(", ")} не являются выбранными`,
      );
    }

    // Обновляем порядок
    this.dataStore.setSelectedItemsOrder(ids);

    return {
      message: "Порядок обновлен",
      selectedItems: ids,
      total: ids.length,
    };
  }

  /**
   * Удаление элементов из выбранных
   */
  private async handleRemoveItem(data: {
    ids: number[];
  }): Promise<RemoveSelectedResult> {
    const { ids } = data;

    // Подсчитываем сколько элементов не были выбраны
    const selectedSet = new Set(this.dataStore.getSelectedItems());
    const notFound = ids.filter((id) => !selectedSet.has(id)).length;

    // Удаляем из выбранных
    const removed = this.dataStore.removeSelectedItems(ids);

    return {
      message:
        removed > 0
          ? `Удалено ${removed} элементов`
          : "Элементы не были выбраны",
      removed,
      notFound,
      totalSelected: this.dataStore.getSelectedItems().length,
    };
  }

  /**
   * Публичные методы для удобного API
   */

  public getAllItems(params?: {
    offset?: number;
    limit?: number;
    filter?: string;
  }): Promise<PaginatedResponse<Item>> {
    return this.enqueue("GET_ALL", params);
  }

  public getSelectedItems(params?: {
    offset?: number;
    limit?: number;
  }): Promise<SelectedItemsResponse> {
    return this.enqueue("GET_SELECTED", params);
  }

  public addSelectedItems(ids: number[]): Promise<AddSelectedResult> {
    return this.enqueue("ADD_ITEM", { ids });
  }

  public updateItemsOrder(ids: number[]): Promise<UpdateOrderResult> {
    return this.enqueue("UPDATE_ORDER", { ids });
  }

  public removeSelectedItems(ids: number[]): Promise<RemoveSelectedResult> {
    return this.enqueue("REMOVE_ITEM", { ids });
  }
}
