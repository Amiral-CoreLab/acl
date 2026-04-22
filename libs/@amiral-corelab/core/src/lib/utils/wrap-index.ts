import { assert } from './assert';

export function wrapIndex(index: number, length: number): number {
  assert(Number.isInteger(index), 'index must be an integer');
  assert(Number.isInteger(length), 'length must be an integer');
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  assert(length > 0, 'length must be positive');

  return ((index % length) + length) % length;
}
