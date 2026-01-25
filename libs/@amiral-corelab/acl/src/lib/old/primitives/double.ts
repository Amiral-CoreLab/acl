import type { BrandedType } from '../structures';

export type Double = BrandedType<number, 'Double'>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Double = (value: unknown): Double => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new TypeError('Double() expects a finite number');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return number as Double;
};
