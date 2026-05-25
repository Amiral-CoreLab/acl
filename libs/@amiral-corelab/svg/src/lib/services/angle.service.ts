import { Singleton } from '@amiral-corelab/core';

/**
 * Provides angle helpers used by SVG geometry and path serialization.
 *
 * Geometry calculations usually use radians because JavaScript trigonometric functions use
 * radians. SVG path data uses degrees for the elliptical arc `x-axis-rotation` parameter,
 * so conversion is needed when center-parameterized geometry becomes an SVG `A` command.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataEllipticalArcCommands
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 */
@Singleton()
export class AngleService {
  /**
   * Converts radians to degrees.
   *
   * Use this before serializing a geometry angle into SVG path data when the target SVG
   * parameter expects degrees, such as `x-axis-rotation` on an elliptical arc command.
   *
   * @param radians Angle in radians.
   *
   * @returns Angle in degrees.
   */
  public radiansToDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  /**
   * Converts degrees to radians.
   *
   * Use this when reading SVG path data into geometry classes that rely on JavaScript
   * trigonometric functions.
   *
   * @param degrees Angle in degrees.
   *
   * @returns Angle in radians.
   */
  public degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Normalizes a radian angle to the `[0, 2π)` range.
   *
   * This is useful when comparing calculated arc angles without changing the represented
   * direction.
   *
   * @param radians Angle in radians.
   *
   * @returns Equivalent angle in the `[0, 2π)` range.
   */
  public normalizeRadians(radians: number): number {
    const fullTurn = Math.PI * 2;

    return ((radians % fullTurn) + fullTurn) % fullTurn;
  }

  /**
   * Normalizes a degree angle to the `[0, 360)` range.
   *
   * This is useful when comparing or serializing SVG rotation values.
   *
   * @param degrees Angle in degrees.
   *
   * @returns Equivalent angle in the `[0, 360)` range.
   */
  public normalizeDegrees(degrees: number): number {
    return ((degrees % 360) + 360) % 360;
  }

  /**
   * Gets the smallest difference between two axis rotations.
   *
   * Ellipse axes are equivalent after half a turn, so this compares angles modulo `π`.
   *
   * @param radiansA First axis angle.
   * @param radiansB Second axis angle.
   *
   * @returns Smallest absolute axis-angle difference in radians.
   */
  public getSmallestAxisAngleDifference(radiansA: number, radiansB: number): number {
    const halfTurn = Math.PI;
    const difference = (((radiansA - radiansB) % halfTurn) + halfTurn) % halfTurn;

    return Math.min(difference, halfTurn - difference);
  }
}
