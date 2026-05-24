import type { InitArg } from '@amiral-corelab/core';
import { PathPrimitiveOrigin } from './path-primitive-origin';
import { PathPrimitiveSegment } from './path-primitive-segment';
import type { PathPrimitive } from './path-primitive';

/**
 * Wraps a drawable primitive with source-path metadata.
 *
 * The wrapper is not itself a path primitive. It provides context for operations like
 * splitting, where normal adjacent contacts should be handled differently from real
 * intersections between unrelated primitives.
 */
export class PathPrimitiveWithOrigin {
  /**
   * Drawable geometry primitive.
   */
  public readonly primitive: PathPrimitive;

  /**
   * Source metadata for the primitive.
   */
  public readonly origin: PathPrimitiveOrigin;

  /**
   * Creates a primitive wrapper with origin metadata.
   *
   * @param initArg Source wrapper values.
   */
  public constructor(initArg?: InitArg<PathPrimitiveWithOrigin>) {
    this.primitive = initArg?.primitive ?? new PathPrimitiveSegment();
    this.origin = initArg?.origin ?? new PathPrimitiveOrigin();
  }
}
