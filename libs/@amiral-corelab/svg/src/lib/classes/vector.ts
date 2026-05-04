import type { Point } from './point';

/**
 * FR: Représente un vecteur 2D utilisé pour les calculs de direction et de longueur.
 * EN: Represents a 2D vector used for direction and length calculations.
 */
export class Vector {
  public static fromPoints(from: Point, to: Point): Vector {
    return new Vector(to.x - from.x, to.y - from.y);
  }

  public static subtract(first: Point, second: Point): Vector {
    return new Vector(first.x - second.x, first.y - second.y);
  }

  public static cross(first: Vector, second: Vector): number {
    return first.x * second.y - first.y * second.x;
  }

  public static dot(first: Vector, second: Vector): number {
    return first.x * second.x + first.y * second.y;
  }

  public static pointKey(point: Point): string {
    return `${point.x},${point.y}`;
  }

  /**
   * Computes the signed angle from one vector to another.
   *
   * The result is positive for one rotation direction and negative for the other. This matches the
   * `angle(u, v)` formula used by SVG arc endpoint-to-center conversion.
   *
   * @param fromVector Source vector `u`.
   * @param toVector Target vector `v`.
   *
   * @returns The signed angle from `fromVector` to `toVector`, in radians.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  public static signedAngle(fromVector: Vector, toVector: Vector): number {
    const crossProduct = Vector.cross(fromVector, toVector);
    const dotProduct = Vector.dot(fromVector, toVector);

    return Math.atan2(crossProduct, dotProduct);
  }

  public readonly x: number;
  public readonly y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public get length(): number {
    return Math.hypot(this.x, this.y);
  }

  public get normalized(): Vector {
    const { length } = this;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      return new Vector(0, 0);
    }

    return new Vector(this.x / length, this.y / length);
  }
}
