import type { Background } from 'apcach';
import type { ContrastChromaMapType, ContrastRangeType, HueRangeType } from '../types';

export interface WorkerDataColorInModel {
  contrastRange: ContrastRangeType;
  hueRange: HueRangeType;
  backgroundColor: Background;
  evenChromaMap: ContrastChromaMapType;
}
