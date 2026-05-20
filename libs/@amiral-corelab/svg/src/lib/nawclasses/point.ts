import type { InitArg } from '@amiral-corelab/core';
import type { Vector } from './vector';

/**
 * Represents a 2D point in the SVG user coordinate system.
 *
 * A point is only a position: an `x` coordinate and a `y` coordinate. In SVG paths,
 * commands move or draw from the current point to another point expressed with these
 * coordinates.
 *
 * @see https://www.w3.org/TR/SVG/paths.html#PathDataGeneralInformation
 */
export class Point {
  /**
   * Horizontal coordinate in the SVG user coordinate system.
   */
  public readonly x: number;

  /**
   * Vertical coordinate in the SVG user coordinate system.
   */
  public readonly y: number;

  /**
   * Creates a point from another point-like value.
   *
   * @param initArg Source point coordinates.
   */
  public constructor(initArg?: InitArg<Point>) {
    this.x = initArg?.x ?? 0;
    this.y = initArg?.y ?? 0;
  }

  /**
   * Creates a new point moved from this point along a vector.
   *
   * The vector provides the direction or offset, and `distance` scales that vector. This is
   * useful when placing tangent points on a path edge, such as the entry and exit points of
   * a rounded corner.
   *
   * @param vector Direction or offset used to move the point.
   * @param scale Scale applied to the vector.
   *
   * @returns A new moved point.
   *
   * @see https://www.w3.org/TR/SVG/coords.html
   */
  public moveAlongVector(vector: Vector, scale = 1): Point {
    return new Point({
      x: this.x + vector.x * scale,
      y: this.y + vector.y * scale,
    });
  }
}
