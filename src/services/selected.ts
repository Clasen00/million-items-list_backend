import { dataStore } from "../models/dataStore";
import {
  validatePaginationParams,
  validateIdsArray,
  validateItemsExist,
  validateNoDuplicates,
  validateAllIdsSelected,
  validateOrderComplete,
} from "../utils/validators";
import { paginateArray, createPaginationResponse } from "../utils/pagination";
import { PAGINATION } from "../config/constants";
import type {
  SelectedItemsResponse,
  AddSelectedResult,
  UpdateOrderResult,
  RemoveSelectedResult,
} from "../types";

/**
 * Сервис для управления выбранными элементами
 * Обрабатывает логику получения, добавления, изменения порядка и удаления выбранных элементов
 */
class SelectedService {
  /**
   * Получает список выбранных элементов с пагинацией
   * @param offset - Смещение для пагинации
   * @param limit - Количество элементов на странице
   * @returns Пагинированный ответ с выбранными элементами и их ID
   */
  getSelected(offset: number, limit: number): SelectedItemsResponse {
    validatePaginationParams(offset, limit, PAGINATION.MAX_LIMIT);

    const selectedIds = dataStore.getSelectedItems();
    const selectedItemsData = dataStore.getItemsByIds(selectedIds);

    const total = selectedItemsData.length;
    const paginatedItems = paginateArray(selectedItemsData, offset, limit);
    const paginatedIds = paginateArray(selectedIds, offset, limit);

    return {
      ...createPaginationResponse(paginatedItems, offset, limit, total),
      selectedIds: paginatedIds,
    };
  }

  /**
   * Добавляет элементы в список выбранных
   * @param ids - Массив ID элементов для добавления
   * @returns Результат операции с информацией о добавленных и дублирующихся элементах
   */
  addSelected(ids: number[]): AddSelectedResult {
    validateIdsArray(ids);
    validateItemsExist(ids, dataStore);

    const { newIds, duplicateIds } = dataStore.addSelectedItems(ids);

    return {
      message: "Items added to selection",
      added: newIds,
      duplicates: duplicateIds,
      totalSelected: dataStore.getSelectedItems().length,
    };
  }

  /**
   * Обновляет порядок выбранных элементов
   * @param ids - Новый порядок ID выбранных элементов
   * @returns Результат операции с обновленным списком
   */
  updateOrder(ids: number[]): UpdateOrderResult {
    validateIdsArray(ids);
    validateNoDuplicates(ids);

    const selectedItems = dataStore.getSelectedItems();

    validateAllIdsSelected(ids, selectedItems);
    validateOrderComplete(ids, selectedItems);

    dataStore.setSelectedItemsOrder(ids);

    return {
      message: "Order updated successfully",
      selectedItems: dataStore.getSelectedItems(),
      total: dataStore.getSelectedItems().length,
    };
  }

  /**
   * Удаляет элементы из списка выбранных
   * @param ids - Массив ID элементов для удаления
   * @returns Результат операции с информацией о количестве удаленных элементов
   */
  removeSelected(ids: number[]): RemoveSelectedResult {
    validateIdsArray(ids);

    const removedCount = dataStore.removeSelectedItems(ids);

    return {
      message: "Items removed from selection",
      removed: removedCount,
      notFound: ids.length - removedCount,
      totalSelected: dataStore.getSelectedItems().length,
    };
  }
}

export const selectedService = new SelectedService();
