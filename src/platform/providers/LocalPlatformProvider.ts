import type {
  InterstitialAdResult,
  LeaderboardEntry,
  PlatformCapabilities,
  PlatformEnvironment,
  PlatformPlayer,
  PlatformService,
  PurchaseProduct,
  RewardedAdResult,
} from '../PlatformService';

const LOCAL_CAPABILITIES: PlatformCapabilities = {
  ads: false,
  rewardedAds: false,
  storage: true,
  player: false,
  leaderboards: false,
  purchases: false,
};

export class LocalPlatformProvider implements PlatformService {
  public readonly capabilities = LOCAL_CAPABILITIES;
  public readonly environment: PlatformEnvironment = {
    providerId: 'local',
    language: null,
    deviceType: detectDeviceType(),
  };

  public async init(): Promise<void> {}
  public async gameReady(): Promise<void> {}
  public async gameplayStart(): Promise<void> {}
  public async gameplayStop(): Promise<void> {}

  public async showInterstitial(_placement: string): Promise<InterstitialAdResult> {
    return { status: 'unsupported' };
  }

  public async showRewarded(_placement: string): Promise<RewardedAdResult> {
    return { status: 'unsupported' };
  }

  public async storageGet(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  public async storageSet(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  public async getPlayer(): Promise<PlatformPlayer | null> {
    return null;
  }

  public async setLeaderboardScore(_leaderboardId: string, _score: number): Promise<boolean> {
    return false;
  }

  public async getLeaderboardEntries(_leaderboardId: string): Promise<readonly LeaderboardEntry[]> {
    return [];
  }

  public async getPurchaseCatalog(): Promise<readonly PurchaseProduct[]> {
    return [];
  }

  public async purchase(_productId: string): Promise<boolean> {
    return false;
  }

  public trackPlatformEvent(
    _name: string,
    _properties: Readonly<Record<string, unknown>>,
  ): void {}

  public subscribeToPause(callback: (paused: boolean) => void): () => void {
    const onVisibilityChange = (): void => callback(document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }
}

function detectDeviceType(): PlatformEnvironment['deviceType'] {
  const shortestSide = Math.min(window.innerWidth, window.innerHeight);
  if (shortestSide < 600) return 'mobile';
  if (shortestSide < 900) return 'tablet';
  return 'desktop';
}
