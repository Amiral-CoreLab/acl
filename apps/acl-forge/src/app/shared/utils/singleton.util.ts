import type { ConstructorType } from '../types';

const singletonMap = new WeakMap();

export const singletonUtil = <T>(constructor: ConstructorType<T>): T => {
  if (singletonMap.has(constructor)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return singletonMap.get(constructor) as T;
  }

  const instance = new constructor();

  singletonMap.set(constructor, instance);

  return instance;
};
