import { Request, Response, NextFunction } from "express";
import { parsePaginationParams } from "../utils/pagination";
import { queue } from "../services/queue";

/**
 * Контроллер для работы с выбранными элементами
 * Обрабатывает HTTP запросы для управления списком выбранных элементов
 */
class SelectedController {
  /**
   * Получить список выбранных элементов с пагинацией
   * @param req - Express Request объект
   * @param res - Express Response объект
   * @param next - Express NextFunction для обработки ошибок
   * @returns Promise<void>
   */
  async getSelected(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { offset, limit } = parsePaginationParams(req.query);
      const filter = (req.query.filter as string) || "";

      const result = await queue.getSelectedItems({ offset, limit, filter });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Добавить элементы в список выбранных
   * @param req - Express Request объект
   * @param res - Express Response объект
   * @param next - Express NextFunction для обработки ошибок
   * @returns Promise<void>
   */
  async addSelected(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { ids } = req.body;

      const result = await queue.addSelectedItems(ids);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновить порядок выбранных элементов
   * @param req - Express Request объект
   * @param res - Express Response объект
   * @param next - Express NextFunction для обработки ошибок
   * @returns Promise<void>
   */
  async updateOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { ids } = req.body;

      const result = await queue.updateItemsOrder(ids);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удалить элементы из списка выбранных
   * @param req - Express Request объект
   * @param res - Express Response объект
   * @param next - Express NextFunction для обработки ошибок
   * @returns Promise<void>
   */
  async removeSelected(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { ids } = req.body;

      const result = queue.removeSelectedItems(ids);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const selectedController = new SelectedController();
