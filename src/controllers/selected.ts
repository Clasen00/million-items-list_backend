import { Request, Response, NextFunction } from "express";
import { selectedService } from "../services/selected";
import { parsePaginationParams } from "../utils/pagination";

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

      const result = selectedService.getSelected(offset, limit);

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

      const result = selectedService.addSelected(ids);

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

      const result = selectedService.updateOrder(ids);

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

      const result = selectedService.removeSelected(ids);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const selectedController = new SelectedController();
