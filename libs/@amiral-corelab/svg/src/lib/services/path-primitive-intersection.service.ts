import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import {
  CornerDefinitionArcCenter,
  PathPrimitiveIntersection,
  Point,
  Segment,
} from '../classes';
import type { PathPrimitiveOrigin, PathPrimitivePair, PathPrimitiveWithOrigin } from '../classes';
import { PathPrimitivePairService } from './path-primitive-pair.service';
import { ArcCenterGeometryService } from './arc-center-geometry.service';

type PathPrimitiveIntersectionInput = PathPrimitive | PathPrimitiveWithOrigin;

/**
 * Computes exact intersections between path primitives.
 *
 * Bounding-box filtering is delegated to `PathPrimitivePairService`; this service receives
 * candidate primitive pairs and performs the geometry-specific checks for segment/segment,
 * segment/arc, and arc/arc intersections.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataGeneralInformation
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 */
@Singleton()
export class PathPrimitiveIntersectionService {
  /**
   * Numeric tolerance used only by comparison predicates.
   *
   * Intersection points and parameters are kept as computed. This value only decides whether
   * a computed number is close enough to a boundary or to another computed point for a
   * geometric predicate.
   */
  private readonly epsilon = 1e-9;
  private readonly arcIntersectionSampleAngle = Math.PI / 64;
  private readonly pathPrimitivePairService = getSingleton(PathPrimitivePairService);
  private readonly arcCenterGeometryService = getSingleton(ArcCenterGeometryService);

  private isZero(value: number): boolean {
    return Math.abs(value) <= this.epsilon;
  }

  private isInUnitInterval(parameter: number): boolean {
    return parameter >= -this.epsilon && parameter <= 1 + this.epsilon;
  }

  private isNearlySamePoint(pointA: Point, pointB: Point): boolean {
    return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) <= this.epsilon;
  }

  /**
   * Computes intersections between two finite straight segments.
   *
   * The calculation solves `p + t*r = q + u*s`, where `t` and `u` become the normalized
   * parameters returned on the intersection object.
   *
   * @param segmentA First segment.
   * @param segmentB Second segment.
   *
   * @returns Intersections between both segments.
   */
  private getSegmentSegmentIntersections(segmentA: Segment, segmentB: Segment): PathPrimitiveIntersection[] {
    const vectorA = segmentA.start.getVectorTo(segmentA.end);
    const vectorB = segmentB.start.getVectorTo(segmentB.end);
    const startOffset = segmentA.start.getVectorTo(segmentB.start);
    const denominator = vectorA.x * vectorB.y - vectorA.y * vectorB.x;

    if (this.isZero(denominator)) {
      return [];
    }

    const parameterA = (startOffset.x * vectorB.y - startOffset.y * vectorB.x) / denominator;
    const parameterB = (startOffset.x * vectorA.y - startOffset.y * vectorA.x) / denominator;

    if (!this.isInUnitInterval(parameterA) || !this.isInUnitInterval(parameterB)) {
      return [];
    }

    const clampedParameterA = Math.max(0, Math.min(1, parameterA));
    const clampedParameterB = Math.max(0, Math.min(1, parameterB));
    const point = new Point({
      x: segmentA.start.x + vectorA.x * clampedParameterA,
      y: segmentA.start.y + vectorA.y * clampedParameterA,
    });

    return [
      new PathPrimitiveIntersection({
        point,
        primitiveA: segmentA,
        primitiveB: segmentB,
        parameterA: clampedParameterA,
        parameterB: clampedParameterB,
      }),
    ];
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
  private getSegmentArcIntersections(
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

  private getArcArcIntersections(
    arcA: CornerDefinitionArcCenter,
    arcB: CornerDefinitionArcCenter,
  ): PathPrimitiveIntersection[] {
    if (
      this.isZero(arcA.radiusX) ||
      this.isZero(arcA.radiusY) ||
      this.isZero(arcB.radiusX) ||
      this.isZero(arcB.radiusY)
    ) {
      return [];
    }

    const sampleCount = Math.max(16, Math.ceil(Math.abs(arcA.deltaAngle) / this.arcIntersectionSampleAngle));
    const intersections: PathPrimitiveIntersection[] = [];

    for (let index = 0; index < sampleCount; index += 1) {
      const parameterStart = index / sampleCount;
      const parameterEnd = (index + 1) / sampleCount;
      const angleStart = arcA.startAngle + arcA.deltaAngle * parameterStart;
      const angleEnd = arcA.startAngle + arcA.deltaAngle * parameterEnd;
      const valueStart = this.arcCenterGeometryService.getPointEllipseValue(arcA.getPointAtAngle(angleStart), arcB);
      const valueEnd = this.arcCenterGeometryService.getPointEllipseValue(arcA.getPointAtAngle(angleEnd), arcB);

      if (this.isZero(valueStart)) {
        intersections.push(...this.createArcArcIntersections(arcA, arcB, angleStart));
      }

      if (valueStart * valueEnd > 0) {
        continue;
      }

      intersections.push(
        ...this.createArcArcIntersections(
          arcA,
          arcB,
          this.findArcArcIntersectionAngle(arcA, arcB, angleStart, angleEnd),
        ),
      );
    }

    const endAngle = arcA.startAngle + arcA.deltaAngle;

    if (this.isZero(this.arcCenterGeometryService.getPointEllipseValue(arcA.getPointAtAngle(endAngle), arcB))) {
      intersections.push(...this.createArcArcIntersections(arcA, arcB, endAngle));
    }

    return this.deduplicateIntersections(intersections);
  }

  /**
   * Refines an arc/arc intersection angle by bisection.
   *
   * @param arcA Arc being sampled.
   * @param arcB Arc whose ellipse equation is tested.
   * @param angleStart Start angle of the bracket.
   * @param angleEnd End angle of the bracket.
   *
   * @returns Refined angle on `arcA`.
   */
  private findArcArcIntersectionAngle(
    arcA: CornerDefinitionArcCenter,
    arcB: CornerDefinitionArcCenter,
    angleStart: number,
    angleEnd: number,
  ): number {
    let start = angleStart;
    let end = angleEnd;
    let startValue = this.arcCenterGeometryService.getPointEllipseValue(arcA.getPointAtAngle(start), arcB);

    for (let iteration = 0; iteration < 64; iteration += 1) {
      const middle = (start + end) / 2;
      const middleValue = this.arcCenterGeometryService.getPointEllipseValue(arcA.getPointAtAngle(middle), arcB);

      if (this.isZero(middleValue)) {
        return middle;
      }

      if (startValue * middleValue <= 0) {
        end = middle;
      } else {
        start = middle;
        startValue = middleValue;
      }
    }

    return (start + end) / 2;
  }

  private createArcArcIntersections(
    arcA: CornerDefinitionArcCenter,
    arcB: CornerDefinitionArcCenter,
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

  private deduplicateIntersections(intersections: PathPrimitiveIntersection[]): PathPrimitiveIntersection[] {
    return intersections.filter((intersection, index) =>
      intersections.every(
        (otherIntersection, otherIndex) =>
          otherIndex >= index || !this.isNearlySamePoint(intersection.point, otherIntersection.point),
      ),
    );
  }

  private deduplicateNearlySamePoints(points: Point[]): Point[] {
    return points.filter((point, index) =>
      points.every((otherPoint, otherIndex) => otherIndex >= index || !this.isNearlySamePoint(point, otherPoint)),
    );
  }

  private withPairOrigins(
    intersection: PathPrimitiveIntersection,
    pair: PathPrimitivePair,
  ): PathPrimitiveIntersection {
    return new PathPrimitiveIntersection({
      point: intersection.point,
      primitiveA: intersection.primitiveA,
      primitiveB: intersection.primitiveB,
      originA: pair.originA,
      originB: pair.originB,
      parameterA: intersection.parameterA,
      parameterB: intersection.parameterB,
    });
  }

  /**
   * Computes intersections between two path primitives.
   *
   * @param primitiveA First primitive.
   * @param primitiveB Second primitive.
   *
   * @returns Exact intersections for the primitive pair.
   */
  public getIntersections(primitiveA: PathPrimitive, primitiveB: PathPrimitive): PathPrimitiveIntersection[] {
    if (primitiveA instanceof Segment && primitiveB instanceof Segment) {
      return this.getSegmentSegmentIntersections(primitiveA, primitiveB);
    }

    if (primitiveA instanceof Segment && primitiveB instanceof CornerDefinitionArcCenter) {
      return this.getSegmentArcIntersections(primitiveA, primitiveB);
    }

    if (primitiveA instanceof CornerDefinitionArcCenter && primitiveB instanceof Segment) {
      return this.getSegmentArcIntersections(primitiveB, primitiveA, true);
    }

    if (primitiveA instanceof CornerDefinitionArcCenter && primitiveB instanceof CornerDefinitionArcCenter) {
      return this.getArcArcIntersections(primitiveA, primitiveB);
    }

    return [];
  }

  /**
   * Computes all exact intersections between candidate primitive pairs.
   *
   * Candidate pairs are first filtered by bounding-box overlap, then passed through exact
   * primitive intersection tests.
   *
   * @param primitives Primitives to inspect.
   *
   * @returns All primitive-pair intersections.
   */
  public getAllIntersections(inputs: PathPrimitiveIntersectionInput[]): PathPrimitiveIntersection[] {
    const pairs = this.pathPrimitivePairService.getIntersectingBoundingBoxPairs(inputs);

    return pairs.flatMap((pair) =>
      this.getIntersections(pair.primitiveA, pair.primitiveB).map((intersection) =>
        this.withPairOrigins(intersection, pair),
      ),
    );
  }

  private isEndpointParameter(parameter: number): boolean {
    return parameter <= this.epsilon || parameter >= 1 - this.epsilon;
  }

  private isOnlySharedEndpoint(intersection: PathPrimitiveIntersection): boolean {
    return this.isEndpointParameter(intersection.parameterA) && this.isEndpointParameter(intersection.parameterB);
  }

  private areOriginsAdjacent(originA: PathPrimitiveOrigin, originB: PathPrimitiveOrigin): boolean {
    if (originA.pathId !== originB.pathId) {
      return false;
    }

    return (
      originA.previousPrimitiveIndex === originB.primitiveIndex ||
      originA.nextPrimitiveIndex === originB.primitiveIndex ||
      originB.previousPrimitiveIndex === originA.primitiveIndex ||
      originB.nextPrimitiveIndex === originA.primitiveIndex
    );
  }

  private isExistingPrimitiveContinuity(intersection: PathPrimitiveIntersection): boolean {
    if (!this.isOnlySharedEndpoint(intersection)) {
      return false;
    }

    if (!intersection.originA || !intersection.originB) {
      return true;
    }

    return this.areOriginsAdjacent(intersection.originA, intersection.originB);
  }

  /**
   * Gets intersections that should create split points.
   *
   * With primitive origin metadata, only endpoint-to-endpoint contacts between adjacent
   * primitives in the same source path are filtered out. Without metadata, endpoint contacts
   * keep the legacy behavior and are treated as existing primitive continuity.
   *
   * @param inputs Primitives or primitive wrappers to inspect.
   *
   * @returns Intersections useful for splitting primitives.
   */
  public getSplitIntersections(inputs: PathPrimitiveIntersectionInput[]): PathPrimitiveIntersection[] {
    return this.getAllIntersections(inputs).filter((intersection) => !this.isExistingPrimitiveContinuity(intersection));
  }

  /**
   * Gets unique split intersection points.
   *
   * This method keeps the computed point values, but groups nearly identical points for
   * display/counting purposes.
   *
   * @param inputs Primitives or primitive wrappers to inspect.
   *
   * @returns Unique points useful for visualizing or counting split locations.
   */
  public getSplitIntersectionPoints(inputs: PathPrimitiveIntersectionInput[]): Point[] {
    return this.deduplicateNearlySamePoints(
      this.getSplitIntersections(inputs).map((intersection) => intersection.point),
    );
  }
}
