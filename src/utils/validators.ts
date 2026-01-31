import { DataStore } from "../models/dataStore";

/**
 * Базовый класс для ошибок API
 */
abstract class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details: string;

  constructor(message: string, details: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Ошибка валидации данных
 */
export class ValidationError extends ApiError {
  constructor(message: string, details: string) {
    super(message, details, 400);
  }
}

/**
 * Ошибка "Ресурс не найден"
 */
export class NotFoundError extends ApiError {
  constructor(message: string, details: string) {
    super(message, details, 404);
  }
}

/**
 * Валидация параметров пагинации
 * @param offset - Смещение для пагинации
 * @param limit - Лимит элементов на странице
 * @param maxLimit - Максимально допустимый лимит
 * @throws {ValidationError} Если параметры невалидны
 */
export const validatePaginationParams = (
  offset: number,
  limit: number,
  maxLimit: number,
): void => {
  if (offset < 0) {
    throw new ValidationError(
      "Invalid pagination parameters",
      "offset must be >= 0",
    );
  }

  if (limit < 1 || limit > maxLimit) {
    throw new ValidationError(
      "Invalid pagination parameters",
      `limit must be between 1 and ${maxLimit}`,
    );
  }
};

/**
 * Валидация массива ID
 * @param ids - Массив ID для валидации
 * @throws {ValidationError} Если массив невалиден
 */
export const validateIdsArray = (ids: number[]) => {
  if (!Array.isArray(ids)) {
    throw new ValidationError("Invalid input", "ids must be an array");
  }

  if (ids.length === 0) {
    throw new ValidationError("Invalid input", "ids array cannot be empty");
  }

  if (
    !ids.every(
      (id): id is number => typeof id === "number" && Number.isInteger(id),
    )
  ) {
    throw new ValidationError("Invalid input", "All ids must be integers");
  }
};

/**
 * Проверка существования элементов в хранилище
 * @param ids - Массив ID для проверки
 * @param dataStore - Экземпляр хранилища данных
 * @throws {NotFoundError} Если какие-либо элементы не найдены
 */
export const validateItemsExist = (
  ids: number[],
  dataStore: DataStore,
): void => {
  const nonExistentIds = ids.filter((id) => !dataStore.itemExists(id));

  if (nonExistentIds.length > 0) {
    throw new NotFoundError(
      "Items not found",
      `The following IDs do not exist: ${nonExistentIds.join(", ")}`,
    );
  }
};

/**
 * Проверка на отсутствие дубликатов в массиве
 * @param ids - Массив ID для проверки
 * @throws {ValidationError} Если найдены дубликаты
 */
export const validateNoDuplicates = (ids: number[]): void => {
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new ValidationError("Invalid input", "Duplicate IDs are not allowed");
  }
};

/**
 * Проверка, что все ID находятся в списке выбранных элементов
 * @param ids - Массив ID для проверки
 * @param selectedItems - Массив выбранных ID
 * @throws {ValidationError} Если какие-либо ID не выбраны
 */
export const validateAllIdsSelected = (
  ids: number[],
  selectedItems: number[],
): void => {
  const currentSelectedSet = new Set(selectedItems);
  const invalidIds = ids.filter((id) => !currentSelectedSet.has(id));

  if (invalidIds.length > 0) {
    throw new ValidationError(
      "Invalid IDs",
      `The following IDs are not in selected items: ${invalidIds.join(", ")}`,
    );
  }
};

/**
 * Проверка полноты нового порядка элементов
 * @param ids - Новый массив ID в нужном порядке
 * @param selectedItems - Текущий массив выбранных ID
 * @throws {ValidationError} Если не все выбранные элементы присутствуют в новом порядке
 */
export const validateOrderComplete = (
  ids: number[],
  selectedItems: number[],
): void => {
  const newIdsSet = new Set(ids);
  const missingIds = selectedItems.filter((id) => !newIdsSet.has(id));

  if (missingIds.length > 0) {
    throw new ValidationError(
      "Incomplete order",
      `The following selected IDs are missing from the new order: ${missingIds.join(", ")}`,
    );
  }
};

/**
 * Интерфейс для результата валидации
 */
export interface ValidationResult {
  isValid: boolean;
  error?: ValidationError | NotFoundError;
}

/**
 * Класс для композиции валидаторов
 */
export class ValidatorChain {
  private validators: Array<() => void> = [];

  /**
   * Добавить валидатор в цепочку
   * @param validator - Функция валидации
   * @returns Текущий экземпляр для цепочки вызовов
   */
  add(validator: () => void): ValidatorChain {
    this.validators.push(validator);
    return this;
  }

  /**
   * Выполнить все валидаторы в цепочке
   * @throws {ValidationError | NotFoundError} Первая возникшая ошибка валидации
   */
  validate(): void {
    for (const validator of this.validators) {
      validator();
    }
  }

  /**
   * Выполнить все валидаторы и вернуть результат
   * @returns Результат валидации
   */
  validateSafe(): ValidationResult {
    try {
      this.validate();
      return { isValid: true };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        return { isValid: false, error };
      }
      throw error;
    }
  }
}

/**
 * Хелпер для создания цепочки валидаторов
 * @returns Новый экземпляр ValidatorChain
 */
export const createValidatorChain = (): ValidatorChain => {
  return new ValidatorChain();
};
