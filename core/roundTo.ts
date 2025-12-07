export const roundTo = (value: number, decimals: number): number => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
