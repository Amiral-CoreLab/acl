import { wrapIndex } from './wrap-index';

export function isWrappedLastIndex(index: number, length: number): boolean {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  return wrapIndex(index, length) === length - 1;
}
