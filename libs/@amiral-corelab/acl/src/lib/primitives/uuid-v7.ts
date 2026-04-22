import type { BrandedType } from '../../../../core/src/lib/types/branded-type';

export type UuidV7 = BrandedType<string, 'UuidV7'>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const UuidV7 = (value?: unknown): UuidV7 => {
  if (value === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return '' as UuidV7;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return value as UuidV7;
};
