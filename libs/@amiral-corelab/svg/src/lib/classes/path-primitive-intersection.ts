import type { InitArg } from '@amiral-corelab/core';
import type { PathPrimitiveOrigin } from './path-primitive-origin';
import { Point } from './point';
import { PathPrimitiveSegment } from './path-primitive-segment';
import type { PathPrimitive } from './path-primitive';

/**
 * Represents an exact intersection result between two path primitives.
 *
 * The `point` stores the intersection position in the SVG user coordinate system.
 * `parameterA` and `parameterB` store the normalized position on each primitive: `0` is the
 * primitive start, `1` is the primitive end, and values between them are interior points.
 *
 * These parameters are kept because the next operation after intersection detection is
 * usually splitting primitives at the intersection point.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataGeneralInformation
 */
export class PathPrimitiveIntersection {
  /**
   * Intersection point in the SVG user coordinate system.
   */
  public readonly point: Point;

  /**
   * First primitive involved in the intersection.
   */
  public readonly primitiveA: PathPrimitive;

  /**
   * Second primitive involved in the intersection.
   */
  public readonly primitiveB: PathPrimitive;

  /**
   * Source metadata for `primitiveA`, when the intersection came from an origin-aware pair.
   */
  public readonly originA: PathPrimitiveOrigin | undefined;

  /**
   * Source metadata for `primitiveB`, when the intersection came from an origin-aware pair.
   */
  public readonly originB: PathPrimitiveOrigin | undefined;

  /**
   * Normalized intersection position on `primitiveA`.
   */
  public readonly parameterA: number;

  /**
   * Normalized intersection position on `primitiveB`.
   */
  public readonly parameterB: number;

  /**
   * Creates a primitive intersection result.
   *
   * @param initArg Source intersection values.
   */
  public constructor(initArg?: InitArg<PathPrimitiveIntersection>) {
    this.point = initArg?.point ?? new Point();
    this.primitiveA = initArg?.primitiveA ?? new PathPrimitiveSegment();
    this.primitiveB = initArg?.primitiveB ?? new PathPrimitiveSegment();
    this.originA = initArg?.originA ?? undefined;
    this.originB = initArg?.originB ?? undefined;
    this.parameterA = initArg?.parameterA ?? 0;
    this.parameterB = initArg?.parameterB ?? 0;
  }
}
