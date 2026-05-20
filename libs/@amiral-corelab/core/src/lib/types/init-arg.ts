export type InitArg<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? never : K]?: T[K] | null;
};
