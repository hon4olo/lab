export interface IdentifiedContent {
  readonly id: string;
}

/** A typed, read-only lookup over authored content. Duplicate IDs remain inspectable by validation. */
export class ContentRegistry<T extends IdentifiedContent> {
  private readonly entries: readonly T[];
  private readonly firstById: ReadonlyMap<string, T>;

  public constructor(entries: readonly T[]) {
    this.entries = [...entries];
    const firstById = new Map<string, T>();
    for (const entry of this.entries) {
      if (!firstById.has(entry.id)) firstById.set(entry.id, entry);
    }
    this.firstById = firstById;
  }

  public get all(): readonly T[] {
    return this.entries;
  }

  public get duplicateIds(): readonly string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const entry of this.entries) {
      if (seen.has(entry.id)) duplicates.add(entry.id);
      seen.add(entry.id);
    }
    return [...duplicates];
  }

  public get(id: string): T | undefined {
    return this.firstById.get(id);
  }

  public has(id: string): boolean {
    return this.firstById.has(id);
  }

  public toMap(): ReadonlyMap<string, T> {
    return new Map(this.firstById);
  }
}
