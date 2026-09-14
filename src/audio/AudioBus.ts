export const AUDIO_BUSES = ['Master', 'Music', 'SFX', 'UI', 'Ambience', 'Voice'] as const;

export type AudioBus = (typeof AUDIO_BUSES)[number];
