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
