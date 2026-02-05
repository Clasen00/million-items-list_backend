import { Request, Response, NextFunction } from "express";
import { parsePaginationParams } from "../utils/pagination";
import { queue } from "../services/queue";
import { CreateItemBody } from "../types";

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

  /**
   * Создать новый элемент
   * @param req - Express Request объект
   * @param res - Express Response объект
   * @param next - Express NextFunction для обработки ошибок
   * @returns Promise<void>
   */
  async createItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id, name, description, category } = req.body as CreateItemBody;

      const result = await queue.createItem({
        id,
        name: name || "",
        description: description || "",
        category: category || "",
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const itemsController = new ItemsController();
