export type CustomerPhase = 'outside' | 'entering' | 'waiting' | 'anticipating' | 'reacted' | 'leaving' | 'left';

export class CustomerLifecycle {
  private phase: CustomerPhase = 'outside';

  public beginEntry(): void {
    this.transition('outside', 'entering');
  }

  public finishEntry(): void {
    this.transition('entering', 'waiting');
  }

  public serveOrder(): void {
    this.transition('waiting', 'anticipating');
  }

  public completeReaction(): void {
    this.transition('anticipating', 'reacted');
  }

  public beginLeaving(): void {
    this.transition('reacted', 'leaving');
  }

  public finishLeaving(): void {
    this.transition('leaving', 'left');
  }

  public snapshot(): CustomerPhase {
    return this.phase;
  }

  private transition(expected: CustomerPhase, next: CustomerPhase): void {
    if (this.phase !== expected) throw new Error(`Cannot move customer from ${this.phase} to ${next}.`);
    this.phase = next;
  }
}
