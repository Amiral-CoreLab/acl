import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveArcCenter } from '../classes';
import {
  PathPrimitiveIntersection,
  PathPrimitiveIntersectionKind,
  type PathPrimitiveIntersectionOverlap,
  Point,
  type Vector,
} from '../classes';
import { ArcCenterService } from './arc-center.service';
import { AngleService } from './angle.service';
import { GeometryMathService } from './geometry-math.service';
import { type GeometryTolerance, GeometryToleranceService } from './geometry-tolerance.service';
import { PolynomialEquationService } from './polynomial-equation.service';

interface ArcIntersectionAngle {
  angle: number;
  isTangent: boolean;
}

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
  private readonly geometryMathService = getSingleton(GeometryMathService);
  private readonly geometryToleranceService = getSingleton(GeometryToleranceService);
  private readonly polynomialEquationService = getSingleton(PolynomialEquationService);

  private readonly minimumOverlapParameterSpan = 1e-9;

  private isNearlySamePoint(pointA: Point, pointB: Point, tolerance: GeometryTolerance): boolean {
    return this.geometryMathService.areNearlySamePoints(pointA, pointB, tolerance);
  }

  private getPointInLocalCoordinates(point: Point, arc: PathPrimitiveArcCenter): Point {
    return this.arcCenterGeometryService.getPointInLocalCoordinates(point, arc);
  }

  private getEllipseAxisPoint(arc: PathPrimitiveArcCenter, localAxisX: number, localAxisY: number): Point {
    const cosA = Math.cos(arc.axisRotation);
    const sinA = Math.sin(arc.axisRotation);

    return new Point(
      arc.center.x + cosA * localAxisX - sinA * localAxisY,
      arc.center.y + sinA * localAxisX + cosA * localAxisY,
    );
  }

  private getLocalEllipseBasis(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
  ): {
    center: Point;
    cosVector: Vector;
    sinVector: Vector;
  } {
    const center = this.getPointInLocalCoordinates(arcA.center, arcB);
    const localCosPoint = this.getPointInLocalCoordinates(this.getEllipseAxisPoint(arcA, arcA.radiusX, 0), arcB);
    const localSinPoint = this.getPointInLocalCoordinates(this.getEllipseAxisPoint(arcA, 0, arcA.radiusY), arcB);

    return {
      center,
      cosVector: center.getVectorTo(localCosPoint),
      sinVector: center.getVectorTo(localSinPoint),
    };
  }

  private getEllipseQuadraticFormCoefficient(
    pointA: Point | Vector,
    pointB: Point | Vector,
    arc: PathPrimitiveArcCenter,
  ): number {
    return this.geometryMathService.getEllipseQuadraticFormValue(pointA, pointB, arc.radiusX, arc.radiusY);
  }

  private haveSameOrientation(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    tolerance: GeometryTolerance,
  ): boolean {
    return (
      this.angleService.getSmallestAxisAngleDifference(arcA.axisRotation, arcB.axisRotation) <= tolerance.parameter
    );
  }

  private havePerpendicularOrientation(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    tolerance: GeometryTolerance,
  ): boolean {
    return (
      this.angleService.getSmallestAxisAngleDifference(arcA.axisRotation + Math.PI / 2, arcB.axisRotation) <=
      tolerance.parameter
    );
  }

  private getEllipseSamplePoints(arc: PathPrimitiveArcCenter): Point[] {
    return [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle) => arc.getPointAtAngle(angle));
  }

  private areEllipseSamplesMutuallyConsistent(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    tolerance: GeometryTolerance,
  ): boolean {
    return (
      this.getEllipseSamplePoints(arcA).every(
        (point) =>
          Math.abs(this.arcCenterGeometryService.getPointEllipseValue(point, arcB)) <= tolerance.implicitEquation,
      ) &&
      this.getEllipseSamplePoints(arcB).every(
        (point) =>
          Math.abs(this.arcCenterGeometryService.getPointEllipseValue(point, arcA)) <= tolerance.implicitEquation,
      )
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

    const hasMatchingParameters =
      (Math.abs(arcA.radiusX - arcB.radiusX) <= tolerance.distance &&
        Math.abs(arcA.radiusY - arcB.radiusY) <= tolerance.distance &&
        this.haveSameOrientation(arcA, arcB, tolerance)) ||
      (Math.abs(arcA.radiusX - arcB.radiusY) <= tolerance.distance &&
        Math.abs(arcA.radiusY - arcB.radiusX) <= tolerance.distance &&
        this.havePerpendicularOrientation(arcA, arcB, tolerance));

    return hasMatchingParameters && this.areEllipseSamplesMutuallyConsistent(arcA, arcB, tolerance);
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
    const boundaryIntersections = this.getSameEllipseOverlapBoundaries(arcA, arcB, tolerance);

    if (boundaryIntersections.length < 2) {
      return boundaryIntersections;
    }

    return this.getSameEllipseOverlapIntersections(arcA, arcB, boundaryIntersections);
  }

  private getSameEllipseOverlapBoundaries(
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

  private getSameEllipseOverlapIntersections(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    boundaryIntersections: PathPrimitiveIntersection[],
  ): PathPrimitiveIntersection[] {
    const sortedIntersections = [...boundaryIntersections].sort(
      (intersectionA, intersectionB) => intersectionA.parameterA - intersectionB.parameterA,
    );
    const [overlapStart] = sortedIntersections;
    const overlapEnd = sortedIntersections[sortedIntersections.length - 1];

    if (
      !overlapStart ||
      !overlapEnd ||
      Math.abs(overlapEnd.parameterA - overlapStart.parameterA) <= this.minimumOverlapParameterSpan
    ) {
      return boundaryIntersections;
    }

    const overlap: PathPrimitiveIntersectionOverlap = {
      end: overlapEnd.point,
      endParameterA: overlapEnd.parameterA,
      endParameterB: overlapEnd.parameterB,
      start: overlapStart.point,
      startParameterA: overlapStart.parameterA,
      startParameterB: overlapStart.parameterB,
    };

    return [overlapStart, overlapEnd].map(
      (intersection) =>
        new PathPrimitiveIntersection({
          kind: PathPrimitiveIntersectionKind.OverlapBoundary,
          overlap,
          point: intersection.point,
          primitiveA: arcA,
          primitiveB: arcB,
          parameterA: intersection.parameterA,
          parameterB: intersection.parameterB,
        }),
    );
  }

  private getEllipseValue(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter, angleA: number): number {
    return this.arcCenterGeometryService.getPointEllipseValue(arcA.getPointAtAngle(angleA), arcB);
  }

  private getEllipseIntersectionPolynomial(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter): number[] {
    const { center, cosVector, sinVector } = this.getLocalEllipseBasis(arcA, arcB);
    const cosSquared = this.getEllipseQuadraticFormCoefficient(cosVector, cosVector, arcB);
    const sinSquared = this.getEllipseQuadraticFormCoefficient(sinVector, sinVector, arcB);
    const sinCos = 2 * this.getEllipseQuadraticFormCoefficient(cosVector, sinVector, arcB);
    const cos = 2 * this.getEllipseQuadraticFormCoefficient(center, cosVector, arcB);
    const sin = 2 * this.getEllipseQuadraticFormCoefficient(center, sinVector, arcB);
    const constant = this.geometryMathService.getImplicitEllipseResidual(center, arcB.radiusX, arcB.radiusY);

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
  ): ArcIntersectionAngle[] {
    const polynomial = this.getEllipseIntersectionPolynomial(arcA, arcB);
    const angles = this.polynomialEquationService.getRealRootResults(polynomial, tolerance).map((root) => ({
      angle: 2 * Math.atan(root.value),
      isTangent: root.isRepeated,
    }));

    if (Math.abs(this.getEllipseValue(arcA, arcB, Math.PI)) <= tolerance.implicitEquation) {
      angles.push({
        angle: Math.PI,
        isTangent: false,
      });
    }

    return this.deduplicateAngleCandidates(
      angles.map((angle) => ({
        angle: this.angleService.normalizeRadians(angle.angle),
        isTangent: angle.isTangent,
      })),
      Math.sqrt(tolerance.parameter),
    );
  }

  private isPointOnEllipse(point: Point, arc: PathPrimitiveArcCenter, tolerance: GeometryTolerance): boolean {
    return Math.abs(this.arcCenterGeometryService.getPointEllipseValue(point, arc)) <= tolerance.implicitEquation;
  }

  private deduplicateAngleCandidates(angles: ArcIntersectionAngle[], tolerance: number): ArcIntersectionAngle[] {
    return [...angles]
      .sort((angleA, angleB) => angleA.angle - angleB.angle)
      .reduce<ArcIntersectionAngle[]>((deduplicatedAngles, angle) => {
        const previousAngle = deduplicatedAngles[deduplicatedAngles.length - 1];

        if (!previousAngle || Math.abs(angle.angle - previousAngle.angle) > tolerance) {
          deduplicatedAngles.push(angle);
          return deduplicatedAngles;
        }

        previousAngle.isTangent ||= angle.isTangent;

        return deduplicatedAngles;
      }, []);
  }

  private createIntersectionsFromPoint(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    point: Point,
    tolerance: GeometryTolerance,
    isTangent = false,
  ): PathPrimitiveIntersection[] {
    const angleA = this.arcCenterGeometryService.getPointAngleOnArc(point, arcA);
    const angleB = this.arcCenterGeometryService.getPointAngleOnArc(point, arcB);

    if (
      !this.arcCenterGeometryService.isAngleOnArc(angleA, arcA.startAngle, arcA.deltaAngle) ||
      !this.arcCenterGeometryService.isAngleOnArc(angleB, arcB.startAngle, arcB.deltaAngle)
    ) {
      return [];
    }

    const normalizedPoint = arcA.getPointAtAngle(angleA);

    if (!this.isPointOnEllipse(normalizedPoint, arcB, tolerance)) {
      return [];
    }

    return [
      new PathPrimitiveIntersection({
        kind: isTangent ? PathPrimitiveIntersectionKind.Tangent : PathPrimitiveIntersectionKind.Crossing,
        point: normalizedPoint,
        primitiveA: arcA,
        primitiveB: arcB,
        parameterA: this.arcCenterGeometryService.getAngleParameterOnArc(angleA, arcA),
        parameterB: this.arcCenterGeometryService.getAngleParameterOnArc(angleB, arcB),
      }),
    ];
  }

  private getDistinctEllipseIntersections(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    tolerance: GeometryTolerance,
  ): PathPrimitiveIntersection[] {
    const arcAAngleIntersections = this.getEllipseIntersectionAngles(arcA, arcB, tolerance).flatMap(
      ({ angle, isTangent }) => {
        const point = arcA.getPointAtAngle(angle);

        if (!this.isPointOnEllipse(point, arcB, tolerance)) {
          return [];
        }

        return this.createIntersectionsFromPoint(arcA, arcB, point, tolerance, isTangent);
      },
    );
    const arcBAngleIntersections = this.getEllipseIntersectionAngles(arcB, arcA, tolerance).flatMap(
      ({ angle, isTangent }) => {
        const point = arcB.getPointAtAngle(angle);

        if (!this.isPointOnEllipse(point, arcA, tolerance)) {
          return [];
        }

        return this.createIntersectionsFromPoint(arcA, arcB, point, tolerance, isTangent);
      },
    );

    return this.deduplicateIntersections([...arcAAngleIntersections, ...arcBAngleIntersections], tolerance);
  }

  /**
   * Computes intersections between two center arcs.
   *
   * Intersections between distinct ellipses are found by substituting the first arc's
   * center-parameterized equation into the second ellipse's implicit equation. The resulting
   * trigonometric quadratic is converted to a quartic with `tan(angle / 2)`, then real roots
   * are isolated numerically. Distinct ellipses are solved in both substitution directions
   * and residual-checked before deduplication to reduce dependence on one quartic's numerical
   * conditioning. Same-ellipse overlaps return the overlap boundary points, which gives split
   * points without manufacturing a single arbitrary overlap point.
   *
   * @param arcA First arc.
   * @param arcB Second arc.
   *
   * @returns Intersections between both arcs.
   */
  public getIntersections(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter): PathPrimitiveIntersection[] {
    const tolerance = this.geometryToleranceService.fromPrimitives(arcA, arcB);

    if (
      this.geometryMathService.isNearlyZero(arcA.radiusX, tolerance.distance) ||
      this.geometryMathService.isNearlyZero(arcA.radiusY, tolerance.distance) ||
      this.geometryMathService.isNearlyZero(arcB.radiusX, tolerance.distance) ||
      this.geometryMathService.isNearlyZero(arcB.radiusY, tolerance.distance)
    ) {
      return [];
    }

    if (this.areSameEllipse(arcA, arcB, tolerance)) {
      return this.getSameEllipseArcIntersections(arcA, arcB, tolerance);
    }

    return this.getDistinctEllipseIntersections(arcA, arcB, tolerance);
  }
}
