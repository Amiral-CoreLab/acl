import { getSingleton, Singleton } from '@amiral-corelab/core';
import { AngleService } from './angle.service';
import type { CornerDefinitionArcCenter } from '../classes';

/**
 * Provides geometry helpers for center-parameterized arcs.
 *
 * Center-parameterized arcs store center, radii, axis rotation, start angle, and signed
 * delta angle. SVG implementation notes use this representation while converting endpoint
 * arc parameters to center parameters.
 *
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 */
@Singleton()
export class ArcCenterGeometryService {
  private readonly angleService = getSingleton(AngleService);

  /**
   * Tests whether an ellipse parameter angle is included in an arc sweep.
   *
   * The arc direction is carried by the sign of `deltaAngle`. Positive values sweep forward,
   * negative values sweep backward. Full-turn arcs include every angle.
   *
   * @param angle Candidate ellipse parameter angle.
   * @param startAngle Arc start angle.
   * @param deltaAngle Signed arc angular extent.
   *
   * @returns Whether the candidate angle lies on the arc span.
   */
  public isAngleOnArc(angle: number, startAngle: number, deltaAngle: number): boolean {
    const fullTurn = Math.PI * 2;

    if (Math.abs(deltaAngle) >= fullTurn) {
      return true;
    }

    const normalizedAngle = this.angleService.normalizeRadians(angle);
    const normalizedStartAngle = this.angleService.normalizeRadians(startAngle);

    if (deltaAngle >= 0) {
      const forwardAngle = this.angleService.normalizeRadians(normalizedAngle - normalizedStartAngle);

      return forwardAngle <= deltaAngle;
    }

    const backwardAngle = this.angleService.normalizeRadians(normalizedStartAngle - normalizedAngle);

    return backwardAngle <= Math.abs(deltaAngle);
  }

  /**
   * Gets the normalized parameter of an angle on a center arc.
   *
   * The returned value follows the arc sweep: `0` is the arc start angle and `1` is the arc
   * end angle. The sign of `deltaAngle` defines the sweep direction.
   *
   * @param angle Candidate ellipse parameter angle.
   * @param arc Center-parameterized arc.
   *
   * @returns Parameter on the arc sweep.
   */
  public getAngleParameterOnArc(angle: number, arc: CornerDefinitionArcCenter): number {
    if (arc.deltaAngle === 0) {
      return 0;
    }

    if (arc.deltaAngle > 0) {
      return this.angleService.normalizeRadians(angle - arc.startAngle) / arc.deltaAngle;
    }

    return this.angleService.normalizeRadians(arc.startAngle - angle) / Math.abs(arc.deltaAngle);
  }

  /**
   * Gets ellipse parameter angles where the rotated ellipse reaches x/y extrema.
   *
   * For a rotated ellipse, axis-aligned extrema are not always at `0`, `π/2`, `π`, and
   * `3π/2`. They are computed from the derivatives of the center-parameterized ellipse.
   *
   * @param arc Center-parameterized arc.
   *
   * @returns Candidate parameter angles for horizontal and vertical extrema.
   */
  public getArcExtremumAngles(arc: CornerDefinitionArcCenter): number[] {
    const cosRotation = Math.cos(arc.axisRotation);
    const sinRotation = Math.sin(arc.axisRotation);
    const xExtremumAngle = Math.atan2(-arc.radiusY * sinRotation, arc.radiusX * cosRotation);
    const yExtremumAngle = Math.atan2(arc.radiusY * cosRotation, arc.radiusX * sinRotation);

    return [xExtremumAngle, xExtremumAngle + Math.PI, yExtremumAngle, yExtremumAngle + Math.PI];
  }
}
