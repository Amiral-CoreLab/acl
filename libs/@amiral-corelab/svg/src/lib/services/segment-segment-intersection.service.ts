import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveSegment } from '../classes';
import {
  PathPrimitiveIntersection,
  PathPrimitiveIntersectionKind,
  type PathPrimitiveIntersectionOverlap,
  type Point,
  type Vector,
} from '../classes';
import { type GeometryTolerance, GeometryToleranceService } from './geometry-tolerance.service';
import { GeometryMathService } from './geometry-math.service';

/**
 * Computes exact intersections between two finite straight segments.
 *
 * Non-parallel segments are solved with the standard parametric line equation
 * `p + t*r = q + u*s`. Collinear overlaps return their boundary points so later split
 * logic has concrete primitive parameters.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataLinetoCommands
 */
@Singleton()
export class SegmentSegmentIntersectionService {
  private readonly geometryToleranceService = getSingleton(GeometryToleranceService);
  private readonly geometryMathService = getSingleton(GeometryMathService);

  private getPointAtParameter(segment: PathPrimitiveSegment, parameter: number): Point {
    return this.geometryMathService.getPointAtSegmentParameter(segment, parameter);
  }

  private createIntersection(
    segmentA: PathPrimitiveSegment,
    segmentB: PathPrimitiveSegment,
    parameterA: number,
    parameterB: number,
    kind = PathPrimitiveIntersectionKind.Crossing,
    overlap?: PathPrimitiveIntersectionOverlap,
  ): PathPrimitiveIntersection {
    return new PathPrimitiveIntersection({
      kind,
      overlap,
      point: this.getPointAtParameter(segmentA, parameterA),
      primitiveA: segmentA,
      primitiveB: segmentB,
      parameterA,
      parameterB,
    });
  }

  private deduplicateIntersections(
    intersections: PathPrimitiveIntersection[],
    tolerance: GeometryTolerance,
  ): PathPrimitiveIntersection[] {
    return intersections.filter((intersection, index) =>
      intersections.every(
        (otherIntersection, otherIndex) =>
          otherIndex >= index ||
          !this.geometryMathService.areNearlySamePoints(intersection.point, otherIntersection.point, tolerance),
      ),
    );
  }

  private getSegmentDirection(segment: PathPrimitiveSegment): Vector {
    return segment.start.getVectorTo(segment.end);
  }

  private getLineIntersectionDenominator(segmentA: PathPrimitiveSegment, segmentB: PathPrimitiveSegment): number {
    return this.getSegmentDirection(segmentA).getCrossProduct(this.getSegmentDirection(segmentB));
  }

  private getSegmentBDirectionPoint(segmentA: PathPrimitiveSegment, segmentB: PathPrimitiveSegment): Point {
    return segmentA.start.moveAlongVector(this.getSegmentDirection(segmentB));
  }

  private getLineIntersectionParameters(
    segmentA: PathPrimitiveSegment,
    segmentB: PathPrimitiveSegment,
    denominator: number,
  ): {
    parameterA: number;
    parameterB: number;
  } {
    const vectorA = this.getSegmentDirection(segmentA);
    const vectorB = this.getSegmentDirection(segmentB);
    const startOffset = segmentA.start.getVectorTo(segmentB.start);

    return {
      parameterA: startOffset.getCrossProduct(vectorB) / denominator,
      parameterB: startOffset.getCrossProduct(vectorA) / denominator,
    };
  }

  private getCollinearIntersections(
    segmentA: PathPrimitiveSegment,
    segmentB: PathPrimitiveSegment,
    tolerance: GeometryTolerance,
  ): PathPrimitiveIntersection[] {
    const vectorA = this.getSegmentDirection(segmentA);
    const vectorB = this.getSegmentDirection(segmentB);
    const lengthASquared = vectorA.getLengthSquared();
    const lengthBSquared = vectorB.getLengthSquared();
    const areaTolerance = this.geometryMathService.getAreaTolerance(tolerance);

    if (
      this.geometryMathService.isNearlyZero(lengthASquared, areaTolerance) ||
      this.geometryMathService.isNearlyZero(lengthBSquared, areaTolerance)
    ) {
      return [];
    }

    const segmentBStartParameter = this.geometryMathService.getProjectionParameter(
      segmentA.start,
      vectorA,
      segmentB.start,
    );
    const segmentBEndParameter = this.geometryMathService.getProjectionParameter(segmentA.start, vectorA, segmentB.end);
    const overlapStartParameterA = Math.max(0, Math.min(segmentBStartParameter, segmentBEndParameter));
    const overlapEndParameterA = Math.min(1, Math.max(segmentBStartParameter, segmentBEndParameter));

    if (overlapStartParameterA > overlapEndParameterA + tolerance.parameter) {
      return [];
    }

    const clampedStartParameterA = this.geometryMathService.clampUnitParameter(overlapStartParameterA);
    const clampedEndParameterA = this.geometryMathService.clampUnitParameter(overlapEndParameterA);
    const startPoint = this.getPointAtParameter(segmentA, clampedStartParameterA);
    const endPoint = this.getPointAtParameter(segmentA, clampedEndParameterA);
    const startParameterB = this.geometryMathService.clampUnitParameter(
      this.geometryMathService.getProjectionParameter(segmentB.start, vectorB, startPoint),
    );
    const endParameterB = this.geometryMathService.clampUnitParameter(
      this.geometryMathService.getProjectionParameter(segmentB.start, vectorB, endPoint),
    );
    const overlap: PathPrimitiveIntersectionOverlap | undefined =
      Math.abs(clampedEndParameterA - clampedStartParameterA) > tolerance.parameter
        ? {
            end: endPoint,
            endParameterA: clampedEndParameterA,
            endParameterB,
            start: startPoint,
            startParameterA: clampedStartParameterA,
            startParameterB,
          }
        : undefined;

    return this.deduplicateIntersections(
      [
        this.createIntersection(
          segmentA,
          segmentB,
          clampedStartParameterA,
          startParameterB,
          overlap ? PathPrimitiveIntersectionKind.OverlapBoundary : PathPrimitiveIntersectionKind.Crossing,
          overlap,
        ),
        this.createIntersection(
          segmentA,
          segmentB,
          clampedEndParameterA,
          endParameterB,
          overlap ? PathPrimitiveIntersectionKind.OverlapBoundary : PathPrimitiveIntersectionKind.Crossing,
          overlap,
        ),
      ],
      tolerance,
    );
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
  public getIntersections(segmentA: PathPrimitiveSegment, segmentB: PathPrimitiveSegment): PathPrimitiveIntersection[] {
    const tolerance = this.geometryToleranceService.fromPrimitives(segmentA, segmentB);
    const denominator = this.getLineIntersectionDenominator(segmentA, segmentB);
    const directionOrientation = this.geometryMathService.getOrientation(
      segmentA.start,
      segmentA.end,
      this.getSegmentBDirectionPoint(segmentA, segmentB),
      tolerance,
    );

    if (directionOrientation === 0) {
      const startOrientation = this.geometryMathService.getOrientation(
        segmentA.start,
        segmentA.end,
        segmentB.start,
        tolerance,
      );

      return startOrientation === 0 ? this.getCollinearIntersections(segmentA, segmentB, tolerance) : [];
    }

    const { parameterA, parameterB } = this.getLineIntersectionParameters(segmentA, segmentB, denominator);

    if (
      !this.geometryMathService.isInUnitInterval(parameterA, tolerance) ||
      !this.geometryMathService.isInUnitInterval(parameterB, tolerance)
    ) {
      return [];
    }

    const clampedParameterA = this.geometryMathService.clampUnitParameter(parameterA);
    const clampedParameterB = this.geometryMathService.clampUnitParameter(parameterB);

    return [this.createIntersection(segmentA, segmentB, clampedParameterA, clampedParameterB)];
  }
}
