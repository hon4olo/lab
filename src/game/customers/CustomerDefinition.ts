export interface CustomerDefinition {
  readonly id: string;
  readonly type: string;
  readonly variantId: string;
  readonly displayNameKey: string;
  readonly basePatienceMs: number;
  readonly appearanceAssets: readonly string[];
}
