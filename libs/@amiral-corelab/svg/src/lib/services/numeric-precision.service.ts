import { Singleton } from '@amiral-corelab/core';

const DEFAULT_DECIMAL_PLACE = 4;
const POWER_BASE = 10;
const NORMALIZED_ZERO = 0;

@Singleton()
export class NumericPrecisionService {
  public decimalPlace = DEFAULT_DECIMAL_PLACE;

  public get minScale(): number {
    return POWER_BASE ** -this.decimalPlace;
  }

  public normalize(value: number): number {
    const factor = POWER_BASE ** this.decimalPlace;
    const roundedValue = Math.round((value + Number.EPSILON) * factor) / factor;
    const tolerance = POWER_BASE ** -this.decimalPlace;
    const isZero = Math.abs(value) < tolerance;

    return isZero ? NORMALIZED_ZERO : roundedValue;
  }
}
