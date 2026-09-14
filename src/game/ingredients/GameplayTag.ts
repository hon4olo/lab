export const GAMEPLAY_TAGS = [
  'HOT',
  'FIRE',
  'ICE',
  'SLIME',
  'SPACE',
  'ROBOT',
  'CAT',
  'DRAGON',
  'ELECTRIC',
  'GLOW',
  'SWEET',
  'TOXIC',
  'MAGIC',
] as const;

export type GameplayTag = (typeof GAMEPLAY_TAGS)[number];

export function isGameplayTag(value: string): value is GameplayTag {
  return GAMEPLAY_TAGS.some((tag) => tag === value);
}
