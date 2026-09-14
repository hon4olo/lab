import { en } from './locales/en';
import { ru } from './locales/ru';
import type { SupportedLocale } from './resolveLocale';

export type TranslationKey = keyof typeof en;

const dictionaries: Record<SupportedLocale, Record<TranslationKey, string>> = { en, ru };

export function createTranslator(locale: SupportedLocale): (key: TranslationKey) => string {
  return (key) => dictionaries[locale][key] ?? en[key];
}
