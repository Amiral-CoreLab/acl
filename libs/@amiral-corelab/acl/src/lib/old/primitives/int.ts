import type { BrandedType } from '../structures';

export type Int = BrandedType<number, 'Int'>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Int = (value: unknown): Int => {
  const number = Number(value);

  if (!Number.isInteger(number)) {
    throw new TypeError('Int() expects an integer number');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return number as Int;
};
