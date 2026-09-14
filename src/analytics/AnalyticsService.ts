export interface AnalyticsEvent {
  readonly name: string;
  readonly properties: Readonly<Record<string, string | number | boolean | null>>;
}

export interface AnalyticsService {
  track(event: AnalyticsEvent): void;
}

export class NoopAnalyticsService implements AnalyticsService {
  public track(_event: AnalyticsEvent): void {}
}
