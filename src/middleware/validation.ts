import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/validators";

/**
 * Интерфейс для схемы валидации
 */
interface ValidationSchema {
  validate(data: unknown): ValidationResult;
}

/**
 * Результат валидации
 */
interface ValidationResult {
  error?: {
    details: Array<{ message: string; path: string[] }>;
  };
  value?: unknown;
}

/**
 * Тип источника данных для валидации
 */
type ValidationSource = "body" | "query" | "params";

/**
 * Middleware для валидации тела запроса с использованием схемы (например, Joi)
 * @param schema - Схема валидации
 * @param source - Источник данных (body, query, params)
 * @returns Express middleware функция
 */
export const validateRequest = (
  schema: ValidationSchema,
  source: ValidationSource = "body",
) => {
  return (req: Request, _: Response, next: NextFunction): void => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate);

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      return next(new ValidationError("Validation error", errorMessage));
    }

    // Заменяем данные валидированными значениями
    req[source] = value as (typeof req)[typeof source];
    next();
  };
};

/**
 * Простая валидация наличия обязательных полей в body
 * @param fields - Массив обязательных полей
 * @returns Express middleware функция
 */
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, _: Response, next: NextFunction): void => {
    const missingFields = fields.filter((field) => !(field in req.body));

    if (missingFields.length > 0) {
      return next(
        new ValidationError(
          "Missing required fields",
          `The following fields are required: ${missingFields.join(", ")}`,
        ),
      );
    }

    next();
  };
};

/**
 * Валидация типов полей
 */
type FieldType = "string" | "number" | "boolean" | "array" | "object";

interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

interface FieldsSchema {
  [key: string]: FieldDefinition;
}

/**
 * Проверка типа значения
 */
const checkType = (value: unknown, type: FieldType): boolean => {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && !isNaN(value);
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return (
        typeof value === "object" && value !== null && !Array.isArray(value)
      );
    default:
      return false;
  }
};

/**
 * Middleware для валидации типов полей
 * @param schema - Схема с определениями полей
 * @param source - Источник данных
 * @returns Express middleware функция
 */
export const validateFieldTypes = (
  schema: FieldsSchema,
  source: ValidationSource = "body",
) => {
  return (req: Request, _: Response, next: NextFunction): void => {
    const data = req[source] as Record<string, unknown>;
    const errors: string[] = [];

    for (const [fieldName, definition] of Object.entries(schema)) {
      const value = data[fieldName];

      // Проверка обязательности
      if (definition.required && (value === undefined || value === null)) {
        errors.push(`Field '${fieldName}' is required`);
        continue;
      }

      // Если поле не обязательное и не предоставлено, пропускаем
      if (!definition.required && (value === undefined || value === null)) {
        continue;
      }

      // Проверка типа
      if (!checkType(value, definition.type)) {
        errors.push(`Field '${fieldName}' must be of type ${definition.type}`);
        continue;
      }

      // Дополнительные проверки для строк
      if (definition.type === "string" && typeof value === "string") {
        if (definition.min !== undefined && value.length < definition.min) {
          errors.push(
            `Field '${fieldName}' must be at least ${definition.min} characters long`,
          );
        }
        if (definition.max !== undefined && value.length > definition.max) {
          errors.push(
            `Field '${fieldName}' must not exceed ${definition.max} characters`,
          );
        }
        if (definition.pattern && !definition.pattern.test(value)) {
          errors.push(
            `Field '${fieldName}' does not match the required pattern`,
          );
        }
      }

      // Дополнительные проверки для чисел
      if (definition.type === "number" && typeof value === "number") {
        if (definition.min !== undefined && value < definition.min) {
          errors.push(
            `Field '${fieldName}' must be at least ${definition.min}`,
          );
        }
        if (definition.max !== undefined && value > definition.max) {
          errors.push(`Field '${fieldName}' must not exceed ${definition.max}`);
        }
      }

      // Дополнительные проверки для массивов
      if (definition.type === "array" && Array.isArray(value)) {
        if (definition.min !== undefined && value.length < definition.min) {
          errors.push(
            `Field '${fieldName}' must contain at least ${definition.min} items`,
          );
        }
        if (definition.max !== undefined && value.length > definition.max) {
          errors.push(
            `Field '${fieldName}' must not contain more than ${definition.max} items`,
          );
        }
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError("Validation failed", errors.join("; ")));
    }

    next();
  };
};

/**
 * Middleware для валидации массива ID в body
 * @returns Express middleware функция
 */
export const validateIdsInBody = () => {
  return validateFieldTypes({
    ids: {
      type: "array",
      required: true,
      min: 1,
    },
  });
};

/**
 * Middleware для санитизации входных данных
 * Удаляет потенциально опасные символы из строк
 */
export const sanitizeInput = (source: ValidationSource = "body") => {
  return (req: Request, _: Response, next: NextFunction): void => {
    const data = req[source] as Record<string, unknown>;

    const sanitizeValue = (value: unknown): unknown => {
      if (typeof value === "string") {
        // Удаляем потенциально опасные символы
        return value
          .replace(/[<>]/g, "") // Удаляем < и >
          .trim();
      }
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      if (typeof value === "object" && value !== null) {
        const sanitized: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val);
        }
        return sanitized;
      }
      return value;
    };

    req[source] = sanitizeValue(data) as (typeof req)[typeof source];
    next();
  };
};
