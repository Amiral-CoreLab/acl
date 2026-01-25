const constant = {
  factor: 10,
} as const;

export const AclMath = {
  clamp: (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max),
  roundTo: (value: number, decimals: number): number => {
    const factor = constant.factor ** decimals;
    return Math.round(value * factor) / factor;
  },
} as const;
