import { dataStore } from "../../models/dataStore";
import { IntegratedQueue } from "./integratedQueue";

/**
 * Единый экземпляр интегрированной очереди для всего приложения
 * Все запросы должны проходить через эту очередь
 */
export const queue = new IntegratedQueue(dataStore);

export { RequestQueue } from "./requestQueue";
export { IntegratedQueue } from "./integratedQueue";
