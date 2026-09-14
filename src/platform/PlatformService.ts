export interface PlatformCapabilities {
  readonly ads: boolean;
  readonly rewardedAds: boolean;
  readonly storage: boolean;
  readonly player: boolean;
  readonly leaderboards: boolean;
  readonly purchases: boolean;
}

export interface PlatformEnvironment {
  readonly providerId: string;
  readonly language: string | null;
  readonly deviceType: 'mobile' | 'tablet' | 'desktop' | 'tv' | 'unknown';
}

export interface RewardedAdResult {
  readonly status: 'rewarded' | 'closed' | 'failed' | 'unsupported';
}

export interface InterstitialAdResult {
  readonly status: 'closed' | 'failed' | 'unsupported';
}

export interface PlatformPlayer {
  readonly id: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly score: number;
  readonly player: PlatformPlayer;
}

export interface PurchaseProduct {
  readonly id: string;
  readonly displayPrice: string;
}

export interface PlatformService {
  readonly capabilities: PlatformCapabilities;
  readonly environment: PlatformEnvironment;
  init(): Promise<void>;
  gameReady(): Promise<void>;
  gameplayStart(): Promise<void>;
  gameplayStop(): Promise<void>;
  showInterstitial(placement: string): Promise<InterstitialAdResult>;
  showRewarded(placement: string): Promise<RewardedAdResult>;
  storageGet(key: string): Promise<string | null>;
  storageSet(key: string, value: string): Promise<void>;
  getPlayer(): Promise<PlatformPlayer | null>;
  setLeaderboardScore(leaderboardId: string, score: number): Promise<boolean>;
  getLeaderboardEntries(leaderboardId: string): Promise<readonly LeaderboardEntry[]>;
  getPurchaseCatalog(): Promise<readonly PurchaseProduct[]>;
  purchase(productId: string): Promise<boolean>;
  trackPlatformEvent(name: string, properties: Readonly<Record<string, unknown>>): void;
  subscribeToPause(callback: (paused: boolean) => void): () => void;
}
