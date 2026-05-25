import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveArcCenter, PathPrimitiveSegment, Point } from '../classes';
import { PathPrimitiveIntersection, PathPrimitiveIntersectionKind } from '../classes';
import { ArcCenterService } from './arc-center.service';
import { GeometryToleranceService } from './geometry-tolerance.service';
import { GeometryMathService } from './geometry-math.service';
import { QuadraticEquationService } from './quadratic-equation.service';

/**
 * Computes exact intersections between a finite straight segment and a center arc.
 *
 * The segment is transformed into the arc's local ellipse coordinate system, where the
 * intersection problem becomes a quadratic line/ellipse equation.
 *
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 */
@Singleton()
export class SegmentArcIntersectionService {
  private readonly arcCenterService = getSingleton(ArcCenterService);
  private readonly geometryToleranceService = getSingleton(GeometryToleranceService);
  private readonly geometryMathService = getSingleton(GeometryMathService);
  private readonly quadraticEquationService = getSingleton(QuadraticEquationService);

  private getLineEllipseQuadraticCoefficients(
    localSegmentStart: Point,
    localSegmentEnd: Point,
    arc: PathPrimitiveArcCenter,
  ): {
    quadraticA: number;
    quadraticB: number;
    quadraticC: number;
  } {
    const localSegmentDirection = localSegmentStart.getVectorTo(localSegmentEnd);

    return {
      quadraticA: this.geometryMathService.getEllipseRadiusNormalizedSquared(
        localSegmentDirection,
        arc.radiusX,
        arc.radiusY,
      ),
      quadraticB:
        2 *
        ((localSegmentStart.x * localSegmentDirection.x) / arc.radiusX ** 2 +
          (localSegmentStart.y * localSegmentDirection.y) / arc.radiusY ** 2),
      quadraticC: this.geometryMathService.getImplicitEllipseResidual(localSegmentStart, arc.radiusX, arc.radiusY),
    };
  }

  private getLocalPointAtSegmentParameter(localSegmentStart: Point, localSegmentEnd: Point, parameter: number): Point {
    return localSegmentStart.moveAlongVector(localSegmentStart.getVectorTo(localSegmentEnd), parameter);
  }

  /**
   * Computes intersections between a segment and a center-parameterized arc.
   *
   * The segment is transformed into the ellipse local coordinate system, then substituted
   * into the ellipse equation. Candidate solutions are filtered against both the segment
   * interval and the arc sweep.
   *
   * @param segment Segment primitive to intersect.
   * @param arc Center-parameterized arc primitive to intersect.
   * @param reversePrimitiveOrder Whether returned primitive/parameter order should be arc then segment.
   *
   * @returns Intersections between the segment and arc.
   */
  public getIntersections(
    segment: PathPrimitiveSegment,
    arc: PathPrimitiveArcCenter,
    reversePrimitiveOrder = false,
  ): PathPrimitiveIntersection[] {
    const tolerance = this.geometryToleranceService.fromPrimitives(segment, arc);

    if (
      this.geometryMathService.isNearlyZero(arc.radiusX, tolerance.distance) ||
      this.geometryMathService.isNearlyZero(arc.radiusY, tolerance.distance)
    ) {
      return [];
    }

    const localSegmentStart = this.arcCenterService.getPointInLocalCoordinates(segment.start, arc);
    const localSegmentEnd = this.arcCenterService.getPointInLocalCoordinates(segment.end, arc);
    const { quadraticA, quadraticB, quadraticC } = this.getLineEllipseQuadraticCoefficients(
      localSegmentStart,
      localSegmentEnd,
      arc,
    );
    const { isTangent, roots: segmentParameters } = this.quadraticEquationService.getRealRoots(
      quadraticA,
      quadraticB,
      quadraticC,
      tolerance.implicitEquation,
    );

    return segmentParameters.flatMap((segmentParameter) => {
      if (!this.geometryMathService.isInUnitInterval(segmentParameter, tolerance)) {
        return [];
      }

      const clampedSegmentParameter = this.geometryMathService.clampUnitParameter(segmentParameter);
      const localPoint = this.getLocalPointAtSegmentParameter(
        localSegmentStart,
        localSegmentEnd,
        clampedSegmentParameter,
      );
      const residual = this.geometryMathService.getImplicitEllipseResidual(localPoint, arc.radiusX, arc.radiusY);

      if (Math.abs(residual) > tolerance.implicitEquation) {
        return [];
      }

      const angle = this.geometryMathService.getEllipseParameterAngle(localPoint, arc.radiusX, arc.radiusY);

      if (!this.arcCenterService.isAngleOnArc(angle, arc.startAngle, arc.deltaAngle)) {
        return [];
      }

      const arcParameter = this.arcCenterService.getAngleParameterOnArc(angle, arc);
      const point = this.geometryMathService.getPointAtSegmentParameter(segment, clampedSegmentParameter);

      return [
        new PathPrimitiveIntersection({
          kind: isTangent ? PathPrimitiveIntersectionKind.Tangent : PathPrimitiveIntersectionKind.Crossing,
          point,
          primitiveA: reversePrimitiveOrder ? arc : segment,
          primitiveB: reversePrimitiveOrder ? segment : arc,
          parameterA: reversePrimitiveOrder ? arcParameter : clampedSegmentParameter,
          parameterB: reversePrimitiveOrder ? clampedSegmentParameter : arcParameter,
        }),
      ];
    });
  }
}
