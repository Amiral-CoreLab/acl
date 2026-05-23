import type { InitArg } from '@amiral-corelab/core';
import { CornerDefinitionArc } from './corner-definition-arc';
import { Point } from './point';

/**
 * Defines a vertex corner with center-parameterized elliptical arc values.
 *
 * This format stores the ellipse center, radii, rotation, start angle, and angular extent.
 * The entry and exit points are derived from `startAngle` and `startAngle + deltaAngle`.
 * Angle values in this class are stored in radians because they are used directly with
 * JavaScript trigonometric functions.
 *
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 */
export class CornerDefinitionArcCenter extends CornerDefinitionArc {
  /**
   * Center point of the arc ellipse.
   */
  public readonly center: Point;

  /**
   * Horizontal radius of the ellipse before axis rotation.
   */
  public readonly radiusX: number;

  /**
   * Vertical radius of the ellipse before axis rotation.
   */
  public readonly radiusY: number;

  /**
   * Rotation of the ellipse x-axis relative to the SVG user coordinate system, in radians.
   */
  public readonly axisRotation: number;

  /**
   * Angle where the arc starts on the ellipse, in radians.
   */
  public readonly startAngle: number;

  /**
   * Signed angular extent from the start angle to the end angle, in radians.
   */
  public readonly deltaAngle: number;

  /**
   * Creates a center-parameterized arc corner definition.
   *
   * @param initArg Source center arc values.
   */
  public constructor(initArg?: InitArg<CornerDefinitionArcCenter>) {
    super();

    this.center = initArg?.center ?? new Point();
    this.radiusX = initArg?.radiusX ?? 0;
    this.radiusY = initArg?.radiusY ?? 0;
    this.axisRotation = initArg?.axisRotation ?? 0;
    this.startAngle = initArg?.startAngle ?? 0;
    this.deltaAngle = initArg?.deltaAngle ?? 0;
  }

  /**
   * Computes a point on the rotated ellipse for a center-parameterized angle.
   *
   * This follows the center-parameterized form used by SVG arc implementation notes:
   * a point is first evaluated on the local ellipse, then rotated into the SVG user
   * coordinate system.
   *
   * @param angle Angle on the ellipse before axis rotation, in radians.
   *
   * @returns Point in the SVG user coordinate system.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  public getPointAtAngle(angle: number): Point {
    const cosRotation = Math.cos(this.axisRotation);
    const sinRotation = Math.sin(this.axisRotation);
    const x = this.radiusX * Math.cos(angle);
    const y = this.radiusY * Math.sin(angle);

    return new Point({
      x: this.center.x + cosRotation * x - sinRotation * y,
      y: this.center.y + sinRotation * x + cosRotation * y,
    });
  }

  /**
   * Start point of the arc in the SVG user coordinate system.
   */
  public getStart(): Point {
    return this.getPointAtAngle(this.startAngle);
  }

  /**
   * End point of the arc in the SVG user coordinate system.
   */
  public getEnd(): Point {
    return this.getPointAtAngle(this.startAngle + this.deltaAngle);
  }
}
