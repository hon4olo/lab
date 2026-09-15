export interface ProgressionContext {
  readonly unlockedIds: ReadonlySet<string>;
}

/** A renderer-independent read boundary for progression that may change during a shift. */
export interface ProgressionContextProvider {
  getContext(): ProgressionContext;
}

export function createProgressionContext(unlockedIds: readonly string[] = []): ProgressionContext {
  return { unlockedIds: new Set(unlockedIds) };
}

export function createProgressionContextProvider(
  readContext: () => ProgressionContext,
): ProgressionContextProvider {
  return Object.freeze({ getContext: readContext });
}

export function createStaticProgressionContextProvider(
  context: ProgressionContext = createProgressionContext(),
): ProgressionContextProvider {
  return createProgressionContextProvider(() => context);
}
