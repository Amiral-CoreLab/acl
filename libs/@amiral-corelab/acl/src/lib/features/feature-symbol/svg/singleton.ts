type Constructor<T> = new () => T;

const singletonMap = new WeakMap();

export const singleton = <T>(constructor: Constructor<T>): T => {
  if (singletonMap.has(constructor)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return singletonMap.get(constructor) as T;
  }

  const instance = new constructor();

  singletonMap.set(constructor, instance);

  return instance;
};
