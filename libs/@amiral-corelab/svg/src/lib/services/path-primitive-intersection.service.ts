import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveOrigin, PathPrimitivePair, PathPrimitiveWithOrigin, Point } from '../classes';
import { PathPrimitiveArcCenter, PathPrimitiveIntersection, PathPrimitiveSegment } from '../classes';
import { PathPrimitivePairService } from './path-primitive-pair.service';
import { SegmentSegmentIntersectionService } from './segment-segment-intersection.service';
import { SegmentArcIntersectionService } from './segment-arc-intersection.service';
import { ArcArcIntersectionService } from './arc-arc-intersection.service';
import type { PathPrimitive } from '../classes/path-primitive';

export type PathPrimitiveIntersectionInput = PathPrimitive | PathPrimitiveWithOrigin;

/**
 * Computes exact intersections between path primitives.
 *
 * Bounding-box filtering is delegated to `PathPrimitivePairService`; this service receives
 * candidate primitive pairs and dispatches geometry-specific checks to focused services.
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
  private readonly pathPrimitivePairService = getSingleton(PathPrimitivePairService);
  private readonly segmentSegmentIntersectionService = getSingleton(SegmentSegmentIntersectionService);
  private readonly segmentArcIntersectionService = getSingleton(SegmentArcIntersectionService);
  private readonly arcArcIntersectionService = getSingleton(ArcArcIntersectionService);

  private isNearlySamePoint(pointA: Point, pointB: Point): boolean {
    return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) <= this.epsilon;
  }

  private deduplicateNearlySamePoints(points: Point[]): Point[] {
    return points.filter((point, index) =>
      points.every((otherPoint, otherIndex) => otherIndex >= index || !this.isNearlySamePoint(point, otherPoint)),
    );
  }

  private withPairOrigins(intersection: PathPrimitiveIntersection, pair: PathPrimitivePair): PathPrimitiveIntersection {
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
    if (primitiveA instanceof PathPrimitiveSegment && primitiveB instanceof PathPrimitiveSegment) {
      return this.segmentSegmentIntersectionService.getIntersections(primitiveA, primitiveB);
    }

    if (primitiveA instanceof PathPrimitiveSegment && primitiveB instanceof PathPrimitiveArcCenter) {
      return this.segmentArcIntersectionService.getIntersections(primitiveA, primitiveB);
    }

    if (primitiveA instanceof PathPrimitiveArcCenter && primitiveB instanceof PathPrimitiveSegment) {
      return this.segmentArcIntersectionService.getIntersections(primitiveB, primitiveA, true);
    }

    if (primitiveA instanceof PathPrimitiveArcCenter && primitiveB instanceof PathPrimitiveArcCenter) {
      return this.arcArcIntersectionService.getIntersections(primitiveA, primitiveB);
    }

    return [];
  }

  /**
   * Computes all exact intersections between candidate primitive pairs.
   *
   * Candidate pairs are first filtered by bounding-box overlap, then passed through exact
   * primitive intersection tests.
   *
   * @param inputs Primitives or primitive wrappers to inspect.
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
