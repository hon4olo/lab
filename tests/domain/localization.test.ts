import { describe, expect, it } from 'vitest';
import { resolveLocale } from '../../src/localization/resolveLocale';

describe('resolveLocale', () => {
  it('prefers a supported platform language', () => {
    expect(resolveLocale('ru-RU', 'en-US')).toBe('ru');
  });

  it('falls back through browser language to English', () => {
    expect(resolveLocale(null, 'ru-BY')).toBe('ru');
    expect(resolveLocale('de', 'fr')).toBe('en');
  });
});
