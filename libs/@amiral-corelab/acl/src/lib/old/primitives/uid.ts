import type { BrandedType } from '../structures';
import { uuidv7 } from '../packages';

export type Uid = BrandedType<string, 'Uid'>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Uid = (value?: unknown): Uid => {
  if (value === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return uuidv7() as Uid;
  }

  if (typeof value !== 'string') {
    throw new TypeError('Uid() expects a UUID string');
  }

  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

  if (!regex.test(value)) {
    throw new TypeError('Uid() expects a valid UUID');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return value as Uid;
};
