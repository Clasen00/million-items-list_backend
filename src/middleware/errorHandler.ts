import { Request, Response, NextFunction } from "express";
import { ValidationError, NotFoundError } from "../utils/validators";

/**
 * Интерфейс для стандартизированного ответа об ошибке
 */
interface ErrorResponse {
  error: string;
  details: string;
  stack?: string;
  timestamp?: string;
  path?: string;
}

/**
 * Базовый интерфейс для ошибок с дополнительными свойствами
 */
interface AppError extends Error {
  statusCode?: number;
  details?: string;
  isOperational?: boolean;
}

/**
 * Определение, является ли ошибка операционной (ожидаемой)
 * @param error - Объект ошибки
 * @returns true, если ошибка операционная
 */
const isOperationalError = (error: Error): boolean => {
  return (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    (error as AppError).isOperational === true
  );
};

/**
 * Логирование ошибки
 * @param error - Объект ошибки
 * @param req - Express Request
 */
const logError = (error: Error, req: Request): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.socket.remoteAddress;

  console.error("\n=== Error Log ===");
  console.error(`Timestamp: ${timestamp}`);
  console.error(`Method: ${method}`);
  console.error(`URL: ${url}`);
  console.error(`IP: ${ip}`);
  console.error(`Error Name: ${error.name}`);
  console.error(`Error Message: ${error.message}`);

  if ((error as AppError).details) {
    console.error(`Details: ${(error as AppError).details}`);
  }

  if (!isOperationalError(error)) {
    console.error(`Stack: ${error.stack}`);
  }
  console.error("================\n");
};

/**
 * Форматирование ответа об ошибке
 * @param error - Объект ошибки
 * @param req - Express Request
 * @returns Отформатированный объект ответа
 */
const formatErrorResponse = (error: AppError, req: Request): ErrorResponse => {
  const response: ErrorResponse = {
    error: error.message || "Internal server error",
    details: error.details || error.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
  };

  // Добавляем stack trace только в development режиме
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  return response;
};

/**
 * Получение HTTP статус кода из ошибки
 * @param error - Объект ошибки
 * @returns HTTP статус код
 */
const getStatusCode = (error: AppError): number => {
  if (error.statusCode) {
    return error.statusCode;
  }

  // Стандартные ошибки Express
  if (error.name === "UnauthorizedError") {
    return 401;
  }

  if (error.name === "ForbiddenError") {
    return 403;
  }

  if (error.name === "CastError" || error.name === "ValidationError") {
    return 400;
  }

  // По умолчанию Internal Server Error
  return 500;
};

/**
 * Главный обработчик ошибок Express
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Если headers уже отправлены, передаем обработку дефолтному обработчику Express
  if (res.headersSent) {
    return next(err);
  }

  const error = err as AppError;

  // Логируем ошибку
  logError(error, req);

  // Получаем статус код
  const statusCode = getStatusCode(error);

  // Форматируем ответ
  const errorResponse = formatErrorResponse(error, req);

  // Отправляем ответ
  res.status(statusCode).json(errorResponse);
};

/**
 * Обработчик для неизвестных роутов (404)
 */
export const notFoundHandler = (
  req: Request,
  _: Response,
  next: NextFunction,
): void => {
  const error = new NotFoundError(
    "Route not found",
    `The requested route ${req.method} ${req.originalUrl} does not exist`,
  );
  next(error);
};

/**
 * Обработчик для необработанных Promise rejection
 */
export const unhandledRejectionHandler = (): void => {
  process.on(
    "unhandledRejection",
    (reason: unknown, promise: Promise<unknown>) => {
      console.error("Unhandled Rejection at:", promise);
      console.error("Reason:", reason);

      // В продакшене можно добавить логирование в внешний сервис
      // и graceful shutdown
      if (process.env.NODE_ENV === "production") {
        // Например: logger.error('Unhandled Rejection', { reason, promise });
        // process.exit(1);
      }
    },
  );
};

/**
 * Обработчик для необработанных исключений
 */
export const uncaughtExceptionHandler = (): void => {
  process.on("uncaughtException", (error: Error) => {
    console.error("Uncaught Exception:", error);

    // В продакшене нужно завершить процесс
    if (process.env.NODE_ENV === "production") {
      // logger.error('Uncaught Exception', { error });
      process.exit(1);
    }
  });
};

export default errorHandler;
