import type { Point } from './point';

/**
 * Base class for drawable geometry generated from a logical path.
 *
 * Every path primitive has a start point and an end point in the SVG user coordinate system.
 * Concrete primitives currently include straight segments and center-parameterized arcs.
 * SVG command objects are produced later by `PathCommandFactory`.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataGeneralInformation
 */
export abstract class PathPrimitive {
  /**
   * First point drawn by the primitive.
   */
  public abstract readonly start: Point;

  /**
   * Last point drawn by the primitive.
   */
  public abstract readonly end: Point;
}
