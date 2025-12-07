import type { Background } from 'apcach';
import type { ContrastRangeType, HueRangeType } from '../types';

export interface WorkerDataEvenChromaInModel {
  contrastRange: ContrastRangeType;
  hueRange: HueRangeType;
  backgroundColor: Background;
}
