import { dataStore } from "../models/dataStore";
import { validatePaginationParams } from "../utils/validators";
import { paginateArray, createPaginationResponse } from "../utils/pagination";
import { PAGINATION } from "../config/constants";
import { Item, PaginatedResponse } from "../types";

/**
 * Сервис для работы с элементами
 */
class ItemsService {
  /**
   * Получить список элементов с пагинацией и опциональной фильтрацией
   * @param offset - Смещение для пагинации
   * @param limit - Количество элементов на странице
   * @param filter - Строка для фильтрации элементов (опционально)
   * @returns Пагинированный ответ с элементами
   */
  getItems(
    offset: number,
    limit: number,
    filter?: string,
  ): PaginatedResponse<Item> {
    // Валидация параметров пагинации
    validatePaginationParams(offset, limit, PAGINATION.MAX_LIMIT);

    // Получаем все элементы из хранилища
    let filteredItems: Item[] = dataStore.getAllItems();

    // Применяем фильтр, если он указан
    if (filter) {
      const filterLower = filter.toLowerCase().trim();

      filteredItems = filteredItems.filter((item: Item) => {
        return (
          item.name.toLowerCase().includes(filterLower) ||
          item.description.toLowerCase().includes(filterLower) ||
          item.category.toLowerCase().includes(filterLower)
        );
      });
    }

    // Получаем общее количество элементов после фильтрации
    const total = filteredItems.length;

    // Применяем пагинацию
    const paginatedItems = paginateArray(filteredItems, offset, limit);

    // Формируем и возвращаем ответ с метаданными пагинации
    return createPaginationResponse(paginatedItems, offset, limit, total);
  }
}

// Экспортируем единственный экземпляр сервиса (синглтон)
export const itemsService = new ItemsService();
