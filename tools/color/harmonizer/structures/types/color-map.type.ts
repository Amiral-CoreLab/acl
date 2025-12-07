import type { Contrast, Hue } from 'apcach';

export type ColorMapType = Record<Hue, Record<Contrast, { even: string; max: string }>>;
