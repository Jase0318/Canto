export interface TranslationItem {
  text: string;
  jyutping: string;
  partOfSpeech: string;
}

export interface TranslationRecord {
  id: string;
  originalText: string;
  results: TranslationItem[];
  timestamp: number;
}

export interface SuggestionItem {
  text: string;
  jyutping: string;
  explanation: string;
}

export enum ViewState {
  TRANSLATE = 'TRANSLATE',
  HISTORY = 'HISTORY'
}