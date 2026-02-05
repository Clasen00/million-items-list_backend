/**
 * Интерфейс элемента
 */
export interface Item {
  id: number;
  name: string;
  description: string;
  category: string;
  createdAt: string;
}

/**
 * Параметры пагинации
 */
export interface PaginationParams {
  offset: number;
  limit: number;
}

/**
 * Метаданные пагинации в ответе
 */
export interface PaginationMeta {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Типизированный ответ с пагинацией
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Ответ для выбранных элементов с дополнительными ID
 */
export interface SelectedItemsResponse extends PaginatedResponse<Item> {
  selectedIds: number[];
}

/**
 * Результат добавления элементов в выбранные
 */
export interface AddSelectedResult {
  message: string;
  added: number[];
  duplicates: number[];
  totalSelected: number;
}

/**
 * Результат обновления порядка
 */
export interface UpdateOrderResult {
  message: string;
  selectedItems: number[];
  total: number;
}

/**
 * Результат удаления элементов
 */
export interface RemoveSelectedResult {
  message: string;
  removed: number;
  notFound: number;
  totalSelected: number;
}

/**
 * Query параметры для получения элементов
 */
export interface GetItemsQuery extends Partial<PaginationParams> {
  filter?: string;
}

/**
 * Body для операций с выбранными элементами
 */
export interface SelectedItemsBody {
  ids: number[];
}

/**
 * Множественная подписка на очередь
 */
export interface QueueSubscriber {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  subscribedAt: number;
}

/**
 * Поля для элемента очереди
 */
export interface QueueItem {
  id: string;
  action:
    | "GET_ALL"
    | "GET_SELECTED"
    | "ADD_ITEM"
    | "UPDATE_ORDER"
    | "REMOVE_ITEM"
    | "CREATE_ITEM";
  data?: any;
  timestamp: number;
  subscribers: QueueSubscriber[];
  type: "READ" | "WRITE";
}

/**
 * Параметры для пакетной операции
 */
export interface BatchOperation {
  type: "READ" | "WRITE";
  items: QueueItem[];
  executeTime: number;
}

/**
 * Параметры для состояния приложения
 */
export interface State {
  allItems: Map<number, Item>; // Быстрый доступ по ID
  allItemsArray: Item[]; // Для пагинации
  selectedItems: number[]; // Порядок важен для сортировки
  nextId: number;
}

/**
 * Body для создания нового элемента
 */
export interface CreateItemBody {
  id?: number;
  name?: string;
  description?: string;
  category?: string;
}

/**
 * Результат создания элемента
 */
export interface CreateItemResult {
  message: string;
  item: Item;
}
