import type { Constructor } from '../types';
import { assert } from './assert';

const singletonRegistry = new Map<Constructor, unknown>();
const singletonClasses = new Set<Constructor>();

export function Singleton() {
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  return function singletonFn(target: Constructor<any, void[]>): void {
    singletonClasses.add(target);
  };
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export function getSingleton<T>(target: Constructor<T, void[]>): T {
  const existing = singletonRegistry.get(target);

  if (existing !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return existing as T;
  }

  assert(singletonClasses.has(target), 'Class is not registered as singleton');

  const instance = new target();

  singletonRegistry.set(target, instance);

  return instance;
}
