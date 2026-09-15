import { describe, expect, it } from 'vitest';
import { resolveLocale } from '../../src/localization/resolveLocale';
import { createTranslator } from '../../src/localization/createTranslator';

describe('resolveLocale', () => {
  it('prefers a supported platform language', () => {
    expect(resolveLocale('ru-RU', 'en-US')).toBe('ru');
  });

  it('falls back through browser language to English', () => {
    expect(resolveLocale(null, 'ru-BY')).toBe('ru');
    expect(resolveLocale('de', 'fr')).toBe('en');
  });

  it('provides localized copy for the second customer and recipe', () => {
    const english = createTranslator('en');
    const russian = createTranslator('ru');
    for (const key of [
      'order.customer.picky-pigeon',
      'order.cheesy-street-hot-dog',
      'order.glow-sauce',
      'ingredient.hotdog-bun',
      'action.serve-picky-pigeon',
      'reaction.flaming',
    ] as const) {
      expect(english(key)).toBeTruthy();
      expect(russian(key)).toBeTruthy();
    }
  });
});
