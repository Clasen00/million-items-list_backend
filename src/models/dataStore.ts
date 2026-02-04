import { Item } from "../types";

import { INITIAL_ITEMS_COUNT } from "../config/constants";

export class DataStore {
  private items: Item[];
  private selectedItems: number[];

  constructor() {
    this.items = [];
    this.selectedItems = [];
    this.initialize();
  }

  // Инициализация 1M элементов
  initialize() {
    this.items = Array.from({ length: INITIAL_ITEMS_COUNT }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
      category: `Category ${Math.floor(i / 10) + 1}`,
      createdAt: new Date(
        Date.now() - Math.random() * 10000000000,
      ).toISOString(),
    }));
  }

  getAllItems() {
    return this.items;
  }

  getItemById(id: number) {
    return this.items.find((item) => item.id === id);
  }

  getItemsByIds(ids: number[]) {
    return ids
      .map((id) => this.getItemById(id))
      .filter((item) => item !== undefined);
  }

  getSelectedItems() {
    return this.selectedItems;
  }

  addSelectedItems(ids: number[]) {
    const selectedSet = new Set(this.selectedItems);
    const newIds = ids.filter((id) => !selectedSet.has(id));
    const duplicateIds = ids.filter((id) => selectedSet.has(id));

    this.selectedItems.push(...newIds);

    return { newIds, duplicateIds };
  }

  setSelectedItemsOrder(ids: number[]) {
    this.selectedItems = [...ids];
  }

  removeSelectedItems(ids: number[]) {
    const idsToRemove = new Set(ids);
    const initialLength = this.selectedItems.length;

    this.selectedItems = this.selectedItems.filter(
      (id) => !idsToRemove.has(id),
    );

    return initialLength - this.selectedItems.length;
  }

  itemExists(id: number) {
    return this.items.some((item) => item.id === id);
  }

  isItemSelected(id: number) {
    return this.selectedItems.includes(id);
  }
}

// Инстанс синглтона для хранилища
export const dataStore = new DataStore();
