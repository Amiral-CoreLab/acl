import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveArcCenter } from '../classes';
import { PathPrimitiveIntersection, Point } from '../classes';
import { ArcCenterService } from './arc-center.service';
import { AngleService } from './angle.service';
import { type GeometryTolerance, GeometryToleranceService } from './geometry-tolerance.service';
import { PolynomialEquationService } from './polynomial-equation.service';

/**
 * Computes intersections between center-parameterized arcs.
 *
 * Distinct ellipse intersections are found by substituting one arc's parametric ellipse into
 * the other arc's implicit ellipse equation. Same-ellipse arcs are handled separately by
 * checking endpoint overlap candidates.
 *
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 * @see https://www.geometrictools.com/Documentation/RobustIntersectionOfEllipses.pdf
 */
@Singleton()
export class ArcArcIntersectionService {
  private readonly arcCenterGeometryService = getSingleton(ArcCenterService);
  private readonly angleService = getSingleton(AngleService);
  private readonly geometryToleranceService = getSingleton(GeometryToleranceService);
  private readonly polynomialEquationService = getSingleton(PolynomialEquationService);

  private isZero(value: number, tolerance: number): boolean {
    return Math.abs(value) <= tolerance;
  }

  private isNearlySamePoint(pointA: Point, pointB: Point, tolerance: GeometryTolerance): boolean {
    return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) <= tolerance.distance;
  }

  private getPointInLocalCoordinates(point: Point, arc: PathPrimitiveArcCenter): Point {
    return this.arcCenterGeometryService.getPointInLocalCoordinates(point, arc);
  }

  private getSmallestAxisAngleDifference(angleA: number, angleB: number): number {
    const halfTurn = Math.PI;
    const difference = (((angleA - angleB) % halfTurn) + halfTurn) % halfTurn;

    return Math.min(difference, halfTurn - difference);
  }

  private haveSameOrientation(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    tolerance: GeometryTolerance,
  ): boolean {
    return this.getSmallestAxisAngleDifference(arcA.axisRotation, arcB.axisRotation) <= tolerance.parameter;
  }

  private havePerpendicularOrientation(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    tolerance: GeometryTolerance,
  ): boolean {
    return (
      this.getSmallestAxisAngleDifference(arcA.axisRotation + Math.PI / 2, arcB.axisRotation) <= tolerance.parameter
    );
  }

  private areSameEllipse(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    tolerance: GeometryTolerance,
  ): boolean {
    if (!this.isNearlySamePoint(arcA.center, arcB.center, tolerance)) {
      return false;
    }

    return (
      (Math.abs(arcA.radiusX - arcB.radiusX) <= tolerance.distance &&
        Math.abs(arcA.radiusY - arcB.radiusY) <= tolerance.distance &&
        this.haveSameOrientation(arcA, arcB, tolerance)) ||
      (Math.abs(arcA.radiusX - arcB.radiusY) <= tolerance.distance &&
        Math.abs(arcA.radiusY - arcB.radiusX) <= tolerance.distance &&
        this.havePerpendicularOrientation(arcA, arcB, tolerance))
    );
  }

  private deduplicateIntersections(
    intersections: PathPrimitiveIntersection[],
    tolerance: GeometryTolerance,
  ): PathPrimitiveIntersection[] {
    return intersections.filter((intersection, index) =>
      intersections.every(
        (otherIntersection, otherIndex) =>
          otherIndex >= index || !this.isNearlySamePoint(intersection.point, otherIntersection.point, tolerance),
      ),
    );
  }

  private getSameEllipseArcIntersections(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    tolerance: GeometryTolerance,
  ): PathPrimitiveIntersection[] {
    const candidatePoints = [arcA.start, arcA.end, arcB.start, arcB.end];

    return this.deduplicateIntersections(
      candidatePoints.flatMap((point) => {
        const angleA = this.arcCenterGeometryService.getPointAngleOnArc(point, arcA);
        const angleB = this.arcCenterGeometryService.getPointAngleOnArc(point, arcB);

        if (
          !this.arcCenterGeometryService.isAngleOnArc(angleA, arcA.startAngle, arcA.deltaAngle) ||
          !this.arcCenterGeometryService.isAngleOnArc(angleB, arcB.startAngle, arcB.deltaAngle)
        ) {
          return [];
        }

        return [
          new PathPrimitiveIntersection({
            point: arcA.getPointAtAngle(angleA),
            primitiveA: arcA,
            primitiveB: arcB,
            parameterA: this.arcCenterGeometryService.getAngleParameterOnArc(angleA, arcA),
            parameterB: this.arcCenterGeometryService.getAngleParameterOnArc(angleB, arcB),
          }),
        ];
      }),
      tolerance,
    );
  }

  private getEllipseValue(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter, angleA: number): number {
    return this.arcCenterGeometryService.getPointEllipseValue(arcA.getPointAtAngle(angleA), arcB);
  }

  private getEllipseIntersectionPolynomial(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter): number[] {
    const cosA = Math.cos(arcA.axisRotation);
    const sinA = Math.sin(arcA.axisRotation);
    const center = this.getPointInLocalCoordinates(arcA.center, arcB);
    const localCosPoint = this.getPointInLocalCoordinates(
      new Point({
        x: arcA.center.x + cosA * arcA.radiusX,
        y: arcA.center.y + sinA * arcA.radiusX,
      }),
      arcB,
    );
    const localSinPoint = this.getPointInLocalCoordinates(
      new Point({
        x: arcA.center.x - sinA * arcA.radiusY,
        y: arcA.center.y + cosA * arcA.radiusY,
      }),
      arcB,
    );
    const cosVector = center.getVectorTo(localCosPoint);
    const sinVector = center.getVectorTo(localSinPoint);
    const radiusXSquared = arcB.radiusX ** 2;
    const radiusYSquared = arcB.radiusY ** 2;
    const cosSquared = cosVector.x ** 2 / radiusXSquared + cosVector.y ** 2 / radiusYSquared;
    const sinSquared = sinVector.x ** 2 / radiusXSquared + sinVector.y ** 2 / radiusYSquared;
    const sinCos = 2 * ((cosVector.x * sinVector.x) / radiusXSquared + (cosVector.y * sinVector.y) / radiusYSquared);
    const cos = 2 * ((center.x * cosVector.x) / radiusXSquared + (center.y * cosVector.y) / radiusYSquared);
    const sin = 2 * ((center.x * sinVector.x) / radiusXSquared + (center.y * sinVector.y) / radiusYSquared);
    const constant = center.x ** 2 / radiusXSquared + center.y ** 2 / radiusYSquared - 1;

    return [
      cosSquared + cos + constant,
      2 * sinCos + 2 * sin,
      -2 * cosSquared + 4 * sinSquared + 2 * constant,
      -2 * sinCos + 2 * sin,
      cosSquared - cos + constant,
    ];
  }

  private getEllipseIntersectionAngles(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    tolerance: GeometryTolerance,
  ): number[] {
    const polynomial = this.getEllipseIntersectionPolynomial(arcA, arcB);
    const angles = this.polynomialEquationService
      .getRealRoots(polynomial, tolerance)
      .map((root) => 2 * Math.atan(root));

    if (Math.abs(this.getEllipseValue(arcA, arcB, Math.PI)) <= tolerance.implicitEquation) {
      angles.push(Math.PI);
    }

    return this.polynomialEquationService.deduplicateNumbers(
      angles.map((angle) => this.angleService.normalizeRadians(angle)),
      Math.sqrt(tolerance.parameter),
    );
  }

  private createIntersections(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    angleA: number,
  ): PathPrimitiveIntersection[] {
    const point = arcA.getPointAtAngle(angleA);
    const angleB = this.arcCenterGeometryService.getPointAngleOnArc(point, arcB);

    if (!this.arcCenterGeometryService.isAngleOnArc(angleB, arcB.startAngle, arcB.deltaAngle)) {
      return [];
    }

    return [
      new PathPrimitiveIntersection({
        point,
        primitiveA: arcA,
        primitiveB: arcB,
        parameterA: this.arcCenterGeometryService.getAngleParameterOnArc(angleA, arcA),
        parameterB: this.arcCenterGeometryService.getAngleParameterOnArc(angleB, arcB),
      }),
    ];
  }

  /**
   * Computes intersections between two center arcs.
   *
   * Intersections between distinct ellipses are found by substituting the first arc's
   * center-parameterized equation into the second ellipse's implicit equation. The resulting
   * trigonometric quadratic is converted to a quartic with `tan(angle / 2)`, then real roots
   * are isolated numerically. Same-ellipse overlaps return the overlap boundary points,
   * which gives split points without manufacturing a single arbitrary overlap point.
   *
   * @param arcA First arc.
   * @param arcB Second arc.
   *
   * @returns Intersections between both arcs.
   */
  public getIntersections(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter): PathPrimitiveIntersection[] {
    const tolerance = this.geometryToleranceService.fromPrimitives(arcA, arcB);

    if (
      this.isZero(arcA.radiusX, tolerance.distance) ||
      this.isZero(arcA.radiusY, tolerance.distance) ||
      this.isZero(arcB.radiusX, tolerance.distance) ||
      this.isZero(arcB.radiusY, tolerance.distance)
    ) {
      return [];
    }

    if (this.areSameEllipse(arcA, arcB, tolerance)) {
      return this.getSameEllipseArcIntersections(arcA, arcB, tolerance);
    }

    return this.deduplicateIntersections(
      this.getEllipseIntersectionAngles(arcA, arcB, tolerance).flatMap((angle) => {
        if (Math.abs(this.getEllipseValue(arcA, arcB, angle)) > tolerance.implicitEquation) {
          return [];
        }

        return this.createIntersections(arcA, arcB, angle);
      }),
      tolerance,
    );
  }
}
