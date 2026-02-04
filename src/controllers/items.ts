import { Request, Response, NextFunction } from "express";
import { parsePaginationParams } from "../utils/pagination";
import { queue } from "../services/queue";

/**
 * Контроллер для работы с элементами
 * Обрабатывает HTTP запросы для получения списка элементов
 */
class ItemsController {
  /**
   * Получить список элементов с пагинацией и фильтрацией
   * @param req - Express Request объект
   * @param res - Express Response объект
   * @param next - Express NextFunction для обработки ошибок
   * @returns Promise<void>
   */
  async getItems(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { offset, limit } = parsePaginationParams(req.query);
      const filter = (req.query.filter as string) || "";

      const result = await queue.getAllItems({ offset, limit, filter });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const itemsController = new ItemsController();
