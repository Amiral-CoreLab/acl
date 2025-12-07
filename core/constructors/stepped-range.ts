export const SteppedRange = (start: number, step: number, length: number): number[] =>
  Array.from({ length }, (_, i) => start + i * step);
