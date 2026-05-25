import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveOrigin, PathPrimitivePair, PathPrimitiveWithOrigin, Point } from '../classes';
import { PathPrimitiveArcCenter, PathPrimitiveIntersection, PathPrimitiveSegment } from '../classes';
import { PathPrimitivePairService } from './path-primitive-pair.service';
import { SegmentSegmentIntersectionService } from './segment-segment-intersection.service';
import { SegmentArcIntersectionService } from './segment-arc-intersection.service';
import { ArcArcIntersectionService } from './arc-arc-intersection.service';
import type { PathPrimitive } from '../classes/path-primitive';
import { type GeometryTolerance, GeometryToleranceService } from './geometry-tolerance.service';

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
  private readonly geometryToleranceService = getSingleton(GeometryToleranceService);
  private readonly pathPrimitivePairService = getSingleton(PathPrimitivePairService);
  private readonly segmentSegmentIntersectionService = getSingleton(SegmentSegmentIntersectionService);
  private readonly segmentArcIntersectionService = getSingleton(SegmentArcIntersectionService);
  private readonly arcArcIntersectionService = getSingleton(ArcArcIntersectionService);

  private getIntersectionTolerance(intersection: PathPrimitiveIntersection): GeometryTolerance {
    return this.geometryToleranceService.fromPrimitives(intersection.primitiveA, intersection.primitiveB);
  }

  private isNearlySamePoint(pointA: Point, pointB: Point, tolerance: GeometryTolerance): boolean {
    return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) <= tolerance.distance;
  }

  private deduplicateNearlySamePoints(points: Point[], tolerance: GeometryTolerance): Point[] {
    return points.filter((point, index) =>
      points.every(
        (otherPoint, otherIndex) => otherIndex >= index || !this.isNearlySamePoint(point, otherPoint, tolerance),
      ),
    );
  }

  private withPairOrigins(intersection: PathPrimitiveIntersection, pair: PathPrimitivePair): PathPrimitiveIntersection {
    return new PathPrimitiveIntersection({
      kind: intersection.kind,
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
   * @param inputs Primitive wrappers to inspect.
   *
   * @returns All primitive-pair intersections.
   */
  public getAllIntersections(inputs: PathPrimitiveWithOrigin[]): PathPrimitiveIntersection[] {
    const pairs = this.pathPrimitivePairService.getIntersectingBoundingBoxPairs(inputs);

    return pairs.flatMap((pair) =>
      this.getIntersections(pair.primitiveA, pair.primitiveB).map((intersection) =>
        this.withPairOrigins(intersection, pair),
      ),
    );
  }

  private isEndpointParameter(parameter: number, tolerance: GeometryTolerance): boolean {
    return parameter <= tolerance.parameter || parameter >= 1 - tolerance.parameter;
  }

  private isOnlySharedEndpoint(intersection: PathPrimitiveIntersection): boolean {
    const tolerance = this.getIntersectionTolerance(intersection);

    return (
      this.isEndpointParameter(intersection.parameterA, tolerance) &&
      this.isEndpointParameter(intersection.parameterB, tolerance)
    );
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
      return false;
    }

    return this.areOriginsAdjacent(intersection.originA, intersection.originB);
  }

  /**
   * Gets intersections that should create split points.
   *
   * Endpoint-to-endpoint contacts between adjacent primitives in the same source path are
   * filtered out because they represent existing path continuity, not split points.
   *
   * @param inputs Primitive wrappers to inspect.
   *
   * @returns Intersections useful for splitting primitives.
   */
  public getSplitIntersections(inputs: PathPrimitiveWithOrigin[]): PathPrimitiveIntersection[] {
    return this.getAllIntersections(inputs).filter((intersection) => !this.isExistingPrimitiveContinuity(intersection));
  }

  /**
   * Gets unique split intersection points.
   *
   * This method keeps the computed point values, but groups nearly identical points for
   * display/counting purposes.
   *
   * @param inputs Primitive wrappers to inspect.
   *
   * @returns Unique points useful for visualizing or counting split locations.
   */
  public getSplitIntersectionPoints(inputs: PathPrimitiveWithOrigin[]): Point[] {
    const tolerance = this.geometryToleranceService.fromPrimitives(...inputs.map((input) => input.primitive));

    return this.deduplicateNearlySamePoints(
      this.getSplitIntersections(inputs).map((intersection) => intersection.point),
      tolerance,
    );
  }
}
