import type { BrandedType } from '@amiral-corelab/core';
import { assert } from '@amiral-corelab/core';

export type Int32 = BrandedType<number, 'Int32'>;

export interface Int32Constructor {
  (value: unknown): Int32;

  readonly MAX_VALUE: Int32;
  readonly MIN_VALUE: Int32;

  is: (value: unknown) => value is Int32;
}

const INT32_MAX = 2_147_483_647;
const INT32_MIN = -2_147_483_648;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Int32: Int32Constructor = Object.assign(
  (value: unknown): Int32 => {
    const parsed = Number(value);

    assert(Number.isFinite(parsed), 'Invalid number');
    assert(Number.isInteger(parsed), 'Not an integer');
    assert(parsed >= INT32_MIN, 'Below Int32 minimum');
    assert(parsed <= INT32_MAX, 'Above Int32 maximum');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return parsed as Int32;
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    MAX_VALUE: INT32_MAX as Int32,

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    MIN_VALUE: INT32_MIN as Int32,

    is(value: unknown): value is Int32 {
      return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        Number.isInteger(value) &&
        value >= INT32_MIN &&
        value <= INT32_MAX
      );
    },
  },
);
