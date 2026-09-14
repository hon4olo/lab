import type { ChapterDefinition } from '../../game/campaign/ChapterDefinition';
import { FIRST_SHIFT } from '../shifts/firstShift';

export const FIRST_CHAPTER: ChapterDefinition = {
  id: 'street-snack-bar',
  shiftIds: [FIRST_SHIFT.id],
};
