export interface ProgressionContext {
  readonly unlockedIds: ReadonlySet<string>;
}

export function createProgressionContext(unlockedIds: readonly string[] = []): ProgressionContext {
  return { unlockedIds: new Set(unlockedIds) };
}
