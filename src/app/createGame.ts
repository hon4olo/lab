import Phaser from 'phaser';
import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { OrderScene } from './scenes/OrderScene';
import type { TranslationKey } from '../localization/createTranslator';
import { HOT_CHEESE_BURGER_INGREDIENTS } from '../content/ingredients/hotCheeseBurger';
import { HOT_CHEESE_BURGER_EXTRA_SPICY } from '../content/orders/hotCheeseBurgerExtraSpicy';
import { BUSINESS_CAT } from '../content/customers/businessCat';
import { FIRST_SHIFT } from '../content/shifts/firstShift';
import { TRANSFORMATIONS } from '../content/transformations';
import { DEFAULT_BALANCE_CONFIG } from '../game/balance/BalanceConfig';
import { EconomySession } from '../game/economy/EconomySession';
import { createProgressionContext } from '../game/progression/ProgressionContext';
import { ShiftController } from '../game/shifts/ShiftController';

export function createGame(translate: (key: TranslationKey) => string): Phaser.Game {
  const shift = new ShiftController({
    definition: FIRST_SHIFT,
    orders: new Map([[HOT_CHEESE_BURGER_EXTRA_SPICY.id, {
      definition: HOT_CHEESE_BURGER_EXTRA_SPICY,
      ingredients: HOT_CHEESE_BURGER_INGREDIENTS,
    }]]),
    customers: new Map([[BUSINESS_CAT.id, BUSINESS_CAT]]),
    transformations: TRANSFORMATIONS,
    economy: new EconomySession(),
    progression: createProgressionContext(),
    balance: DEFAULT_BALANCE_CONFIG,
  });
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: RUNTIME_CONFIG.canvasParentId,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: RUNTIME_CONFIG.backgroundColor,
    transparent: true,
    render: {
      antialias: true,
      roundPixels: false,
      pixelArt: false,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, PreloadScene, new OrderScene(translate, shift)],
  });
}
