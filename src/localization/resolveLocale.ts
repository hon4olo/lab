export type SupportedLocale = 'en' | 'ru';

export function resolveLocale(
  platformLanguage: string | null,
  browserLanguage: string,
): SupportedLocale {
  return normalizeLocale(platformLanguage) ?? normalizeLocale(browserLanguage) ?? 'en';
}

function normalizeLocale(locale: string | null): SupportedLocale | null {
  const language = locale?.toLowerCase().split('-')[0];
  return language === 'ru' || language === 'en' ? language : null;
}
