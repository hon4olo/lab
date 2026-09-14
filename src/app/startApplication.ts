import type Phaser from 'phaser';
import { createTranslator } from '../localization/createTranslator';
import { resolveLocale } from '../localization/resolveLocale';
import { LocalPlatformProvider } from '../platform/providers/LocalPlatformProvider';
import { APP_EVENTS } from './appEvents';
import { createGame } from './createGame';

export async function startApplication(): Promise<void> {
  const shell = document.querySelector<HTMLElement>('#app');
  const status = document.querySelector<HTMLElement>('#boot-status');
  const platform = new LocalPlatformProvider();

  await platform.init();
  const locale = resolveLocale(platform.environment.language, navigator.language);
  const translate = createTranslator(locale);
  document.documentElement.lang = locale;
  if (status) status.textContent = translate('shell.loading');

  const game = createGame();
  await waitForShell(game);
  await platform.gameReady();

  if (status) status.textContent = translate('shell.ready');
  shell?.setAttribute('aria-busy', 'false');

  if (import.meta.env.DEV) {
    const { installDebugBridge } = await import('../dev/installDebugBridge');
    installDebugBridge(game, platform);
  }
}

function waitForShell(game: Phaser.Game): Promise<void> {
  return new Promise((resolve) => game.events.once(APP_EVENTS.shellReady, resolve));
}
