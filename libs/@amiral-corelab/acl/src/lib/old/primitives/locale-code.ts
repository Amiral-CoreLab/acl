import type { BrandedType } from '../structures';
import { assert } from '../core';

export type LocaleCode = BrandedType<string, 'LocaleCode'>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const LocaleCode = (value?: unknown): LocaleCode => {
  assert(typeof value === 'string', 'LocaleCode() expects a string');

  const [canonical] = Intl.getCanonicalLocales(value);

  assert(canonical !== undefined, 'Invalid locale');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return canonical as LocaleCode;
};
