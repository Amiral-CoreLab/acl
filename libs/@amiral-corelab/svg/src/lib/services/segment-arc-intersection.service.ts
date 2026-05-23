import { getSingleton, Singleton } from '@amiral-corelab/core';
import { CornerDefinitionArcCenter, PathPrimitiveIntersection, Point, Segment } from '../classes';
import { ArcCenterGeometryService } from './arc-center-geometry.service';

/**
 * Computes exact intersections between a finite straight segment and a center arc.
 */
@Singleton()
export class SegmentArcIntersectionService {
  private readonly epsilon = 1e-9;
  private readonly arcCenterGeometryService = getSingleton(ArcCenterGeometryService);

  private isZero(value: number): boolean {
    return Math.abs(value) <= this.epsilon;
  }

  private isInUnitInterval(parameter: number): boolean {
    return parameter >= -this.epsilon && parameter <= 1 + this.epsilon;
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
    arc: CornerDefinitionArcCenter,
    reversePrimitiveOrder = false,
  ): PathPrimitiveIntersection[] {
    if (this.isZero(arc.radiusX) || this.isZero(arc.radiusY)) {
      return [];
    }

    const start = this.arcCenterGeometryService.getPointInLocalCoordinates(segment.start, arc);
    const end = this.arcCenterGeometryService.getPointInLocalCoordinates(segment.end, arc);
    const direction = start.getVectorTo(end);
    const radiusXSquared = arc.radiusX ** 2;
    const radiusYSquared = arc.radiusY ** 2;
    const quadraticA = direction.x ** 2 / radiusXSquared + direction.y ** 2 / radiusYSquared;
    const quadraticB = 2 * ((start.x * direction.x) / radiusXSquared + (start.y * direction.y) / radiusYSquared);
    const quadraticC = start.x ** 2 / radiusXSquared + start.y ** 2 / radiusYSquared - 1;
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

      const clampedSegmentParameter = Math.max(0, Math.min(1, segmentParameter));
      const localPoint = new Point({
        x: start.x + direction.x * clampedSegmentParameter,
        y: start.y + direction.y * clampedSegmentParameter,
      });
      const angle = Math.atan2(localPoint.y / arc.radiusY, localPoint.x / arc.radiusX);

      if (!this.arcCenterGeometryService.isAngleOnArc(angle, arc.startAngle, arc.deltaAngle)) {
        return [];
      }

      const arcParameter = this.arcCenterGeometryService.getAngleParameterOnArc(angle, arc);
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
