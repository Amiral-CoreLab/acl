import type { InitArg } from '@amiral-corelab/core';
import type { Point } from './point';

/**
 * Represents a 2D vector used for direction and distance calculations.
 *
 * Unlike a point, a vector is not a position in the SVG user coordinate system. It describes
 * an offset or direction, such as the direction from one point to another.
 *
 * SVG arc implementation notes use vectors to compute angles and arc direction.
 *
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 */
export class Vector {
  /**
   * Horizontal vector component.
   */
  public readonly x: number;

  /**
   * Vertical vector component.
   */
  public readonly y: number;

  /**
   * Creates a vector from optional component values.
   *
   * @param initArg Source vector values.
   */
  public constructor(initArg?: InitArg<Vector>) {
    this.x = initArg?.x ?? 0;
    this.y = initArg?.y ?? 0;
  }

  /**
   * Computes the vector length.
   *
   * @returns Euclidean length of the vector.
   */
  public getLength(): number {
    return Math.hypot(this.x, this.y);
  }

  /**
   * Computes the dot product with another vector.
   *
   * The dot product is used to measure the angle between two directions.
   *
   * @param vector Vector to compare with this vector.
   *
   * @returns Dot product of both vectors.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  public getDotProduct(vector: Vector): number {
    return this.x * vector.x + this.y * vector.y;
  }

  /**
   * Computes the unsigned angle to another vector.
   *
   * Both vectors are normalized before computing the angle. The dot product is clamped to
   * the valid `acos` range to avoid `NaN` caused by floating point drift.
   *
   * @param vector Target vector.
   *
   * @returns Angle between both vectors, in radians.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  public getAngleTo(vector: Vector): number {
    const from = this.normalize();
    const to = vector.normalize();
    const dotProduct = from.getDotProduct(to);
    const clampedDotProduct = Math.max(-1, Math.min(1, dotProduct));

    return Math.acos(clampedDotProduct);
  }

  /**
   * Creates a unit vector with the same direction.
   *
   * A zero-length vector cannot be normalized to a direction, so it returns a zero vector.
   *
   * @returns Normalized vector.
   */
  public normalize(): Vector {
    const length = this.getLength();

    if (length === 0) {
      return new Vector();
    }

    return new Vector({
      x: this.x / length,
      y: this.y / length,
    });
  }

  /**
   * Creates a vector from one point to another.
   *
   * @param from Start point.
   * @param to End point.
   *
   * @returns Vector representing `to - from`.
   */
  public static fromPoints(from: Point, to: Point): Vector {
    return new Vector({ x: to.x - from.x, y: to.y - from.y });
  }
}
