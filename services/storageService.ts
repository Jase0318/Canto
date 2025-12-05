import { TranslationRecord, TranslationItem } from "../types";

const STORAGE_KEY = "cantolearn_history_v1";

export const saveRecord = (record: TranslationRecord): void => {
  const history = getHistory();
  // Add new record to the beginning
  const updated = [record, ...history];
  // Limit to last 50 entries to keep it light
  const trimmed = updated.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
};

export const getHistory = (): TranslationRecord[] => {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

export const updateRecord = (id: string, newResults: TranslationItem[]): void => {
  const history = getHistory();
  const index = history.findIndex(item => item.id === id);
  if (index !== -1) {
    history[index].results = newResults;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const deleteRecord = (id: string): void => {
  const history = getHistory();
  const updated = history.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};