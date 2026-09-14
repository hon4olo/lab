import type Phaser from 'phaser';
import { createTranslator } from '../localization/createTranslator';
import { resolveLocale } from '../localization/resolveLocale';
import { LocalPlatformProvider } from '../platform/providers/LocalPlatformProvider';
import { APP_EVENTS } from './appEvents';
import { createGame } from './createGame';
import { createCampaignSession } from './createCampaignSession';
import { FIRST_CHAPTER } from '../content/chapters/firstChapter';
import { CampaignSaveCoordinator } from '../save/CampaignSaveCoordinator';
import { createDefaultSaveData } from '../save/SaveSchema';
import { SaveRepository } from '../save/SaveRepository';

export async function startApplication(): Promise<void> {
  const shell = document.querySelector<HTMLElement>('#app');
  const status = document.querySelector<HTMLElement>('#boot-status');
  const platform = new LocalPlatformProvider();

  await platform.init();
  const repository = new SaveRepository(platform);
  const loaded = await repository.load(createDefaultSaveData(FIRST_CHAPTER.id));
  const locale = resolveLocale(loaded.save.settings.locale ?? platform.environment.language, navigator.language);
  const translate = createTranslator(locale);
  document.documentElement.lang = locale;
  const title = document.querySelector<HTMLElement>('#game-title');
  if (title) title.textContent = translate('game.title');
  if (status) status.textContent = translate('shell.loading');

  const campaign = createCampaignSession(loaded.save);
  campaign.startOrRestore();
  const saveCoordinator = new CampaignSaveCoordinator(
    repository,
    campaign,
    { ...loaded.save.settings, locale },
    '0.1.0',
  );
  saveCoordinator.start();
  await saveCoordinator.flush().catch((error: unknown) => {
    console.warn('Snack Lab could not persist the initial campaign snapshot.', error);
  });
  platform.subscribeToPause((paused) => {
    if (paused) campaign.pauseActiveOrder();
    else campaign.resumeActiveOrder();
  });

  const game = createGame(translate, campaign, () => saveCoordinator.flush().catch((error: unknown) => {
    console.warn('Snack Lab could not persist a campaign checkpoint.', error);
  }));
  await waitForGameReady(game);
  await platform.gameReady();

  if (status) status.textContent = translate('shell.ready');
  shell?.setAttribute('aria-busy', 'false');

  if (import.meta.env.DEV) {
    const { installDebugBridge } = await import('../dev/installDebugBridge');
    installDebugBridge(game, platform);
  }
}

function waitForGameReady(game: Phaser.Game): Promise<void> {
  return new Promise((resolve, reject) => {
    const ready = (): void => {
      game.events.off(APP_EVENTS.gameFailed, failed);
      resolve();
    };
    const failed = (error: unknown): void => {
      game.events.off(APP_EVENTS.gameReady, ready);
      reject(error);
    };
    game.events.once(APP_EVENTS.gameReady, ready);
    game.events.once(APP_EVENTS.gameFailed, failed);
  });
}
