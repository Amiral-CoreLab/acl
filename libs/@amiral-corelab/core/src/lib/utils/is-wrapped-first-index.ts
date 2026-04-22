import { wrapIndex } from '@amiral-corelab/core';

export function isWrappedFirstIndex(index: number, length: number): boolean {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  return wrapIndex(index, length) === 0;
}
