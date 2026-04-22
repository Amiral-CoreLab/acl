import { wrapIndex } from './wrap-index';

export interface NeighborIndexes {
  previousIndex: number;
  currentIndex: number;
  nextIndex: number;
}

export function getNeighborIndexes(index: number, length: number): NeighborIndexes {
  const currentIndex = wrapIndex(index, length);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const previousIndex = wrapIndex(currentIndex - 1, length);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const nextIndex = wrapIndex(currentIndex + 1, length);

  return { previousIndex, currentIndex, nextIndex };
}
