import type { InitArg } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import { Segment } from './segment';

/**
 * Groups two path primitives that should be tested together.
 *
 * Pair objects are useful after broad-phase filtering: for example, after comparing
 * primitive bounding boxes, only pairs whose boxes overlap are passed to exact intersection
 * calculations.
 */
export class PathPrimitivePair {
  /**
   * First primitive in the pair.
   */
  public readonly primitiveA: PathPrimitive;

  /**
   * Second primitive in the pair.
   */
  public readonly primitiveB: PathPrimitive;

  /**
   * Creates a path primitive pair.
   *
   * @param initArg Source pair values.
   */
  public constructor(initArg?: InitArg<PathPrimitivePair>) {
    this.primitiveA = initArg?.primitiveA ?? new Segment();
    this.primitiveB = initArg?.primitiveB ?? new Segment();
  }
}
