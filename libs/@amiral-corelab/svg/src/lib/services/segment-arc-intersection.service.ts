import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { ArcCenter, Segment } from '../classes';
import { PathPrimitiveIntersection, Point } from '../classes';
import { ArcCenterService } from './arc-center.service';

/**
 * Computes exact intersections between a finite straight segment and a center arc.
 */
@Singleton()
export class SegmentArcIntersectionService {
  private readonly epsilon = 1e-9;
  private readonly arcCenterService = getSingleton(ArcCenterService);

  private isZero(value: number): boolean {
    return Math.abs(value) <= this.epsilon;
  }

  private isInUnitInterval(parameter: number): boolean {
    return parameter >= -this.epsilon && parameter <= 1 + this.epsilon;
  }

  private clampUnitParameter(parameter: number): number {
    return Math.max(0, Math.min(1, parameter));
  }

  /**
   * Computes intersections between a segment and a center-parameterized arc.
   *
   * The segment is transformed into the ellipse local coordinate system, then substituted
   * into the ellipse equation. Candidate solutions are filtered against both the segment
   * interval and the arc sweep.
   *
   * @param segment Segment to intersect.
   * @param arc Arc to intersect.
   * @param reversePrimitiveOrder Whether returned primitive/parameter order should be arc then segment.
   *
   * @returns Intersections between the segment and arc.
   */
  public getIntersections(
    segment: Segment,
    arc: ArcCenter,
    reversePrimitiveOrder = false,
  ): PathPrimitiveIntersection[] {
    if (this.isZero(arc.radiusX) || this.isZero(arc.radiusY)) {
      return [];
    }

    const localSegmentStart = this.arcCenterService.getPointInLocalCoordinates(segment.start, arc);
    const localSegmentEnd = this.arcCenterService.getPointInLocalCoordinates(segment.end, arc);
    const localSegmentDirection = localSegmentStart.getVectorTo(localSegmentEnd);
    const radiusXSquared = arc.radiusX ** 2;
    const radiusYSquared = arc.radiusY ** 2;
    const quadraticA = localSegmentDirection.x ** 2 / radiusXSquared + localSegmentDirection.y ** 2 / radiusYSquared;
    const quadraticB =
      2 *
      ((localSegmentStart.x * localSegmentDirection.x) / radiusXSquared +
        (localSegmentStart.y * localSegmentDirection.y) / radiusYSquared);
    const quadraticC = localSegmentStart.x ** 2 / radiusXSquared + localSegmentStart.y ** 2 / radiusYSquared - 1;
    const discriminant = quadraticB ** 2 - 4 * quadraticA * quadraticC;

    if (this.isZero(quadraticA) || discriminant < -this.epsilon) {
      return [];
    }

    const segmentParameters = this.isZero(discriminant)
      ? [-quadraticB / (2 * quadraticA)]
      : [
          (-quadraticB - Math.sqrt(discriminant)) / (2 * quadraticA),
          (-quadraticB + Math.sqrt(discriminant)) / (2 * quadraticA),
        ];

    return segmentParameters.flatMap((segmentParameter) => {
      if (!this.isInUnitInterval(segmentParameter)) {
        return [];
      }

      const clampedSegmentParameter = this.clampUnitParameter(segmentParameter);
      const localPoint = new Point({
        x: localSegmentStart.x + localSegmentDirection.x * clampedSegmentParameter,
        y: localSegmentStart.y + localSegmentDirection.y * clampedSegmentParameter,
      });
      const angle = Math.atan2(localPoint.y / arc.radiusY, localPoint.x / arc.radiusX);

      if (!this.arcCenterService.isAngleOnArc(angle, arc.startAngle, arc.deltaAngle)) {
        return [];
      }

      const arcParameter = this.arcCenterService.getAngleParameterOnArc(angle, arc);
      const point = new Point({
        x: segment.start.x + (segment.end.x - segment.start.x) * clampedSegmentParameter,
        y: segment.start.y + (segment.end.y - segment.start.y) * clampedSegmentParameter,
      });

      return [
        new PathPrimitiveIntersection({
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
