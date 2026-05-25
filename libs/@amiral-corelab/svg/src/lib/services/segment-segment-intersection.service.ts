import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveSegment } from '../classes';
import {
  PathPrimitiveIntersection,
  PathPrimitiveIntersectionKind,
  type PathPrimitiveIntersectionOverlap,
  Point,
} from '../classes';
import { type GeometryTolerance, GeometryToleranceService } from './geometry-tolerance.service';

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

  private readonly floatingPointOrientationErrorMultiplier = 4;

  private isZero(value: number, tolerance: number): boolean {
    return Math.abs(value) <= tolerance;
  }

  private isInUnitInterval(parameter: number, tolerance: GeometryTolerance): boolean {
    return parameter >= -tolerance.parameter && parameter <= 1 + tolerance.parameter;
  }

  private clampUnitParameter(parameter: number): number {
    return Math.max(0, Math.min(1, parameter));
  }

  private isNearlySamePoint(pointA: Point, pointB: Point, tolerance: GeometryTolerance): boolean {
    return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) <= tolerance.distance;
  }

  private getAreaTolerance(tolerance: GeometryTolerance): number {
    return tolerance.distance * tolerance.scale;
  }

  private getOrientation(pointA: Point, pointB: Point, pointC: Point, tolerance: GeometryTolerance): number {
    const abX = pointB.x - pointA.x;
    const abY = pointB.y - pointA.y;
    const acX = pointC.x - pointA.x;
    const acY = pointC.y - pointA.y;
    const determinant = abX * acY - abY * acX;
    const determinantScale = Math.max(Math.abs(abX * acY), Math.abs(abY * acX), tolerance.scale, 1);
    const floatingPointError = Number.EPSILON * this.floatingPointOrientationErrorMultiplier * determinantScale;
    const orientationTolerance = Math.max(this.getAreaTolerance(tolerance), floatingPointError);

    if (determinant > orientationTolerance) {
      return 1;
    }

    if (determinant < -orientationTolerance) {
      return -1;
    }

    return 0;
  }

  private getPointAtParameter(segment: PathPrimitiveSegment, parameter: number): Point {
    return new Point({
      x: segment.start.x + (segment.end.x - segment.start.x) * parameter,
      y: segment.start.y + (segment.end.y - segment.start.y) * parameter,
    });
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
          otherIndex >= index || !this.isNearlySamePoint(intersection.point, otherIntersection.point, tolerance),
      ),
    );
  }

  private getCollinearIntersections(
    segmentA: PathPrimitiveSegment,
    segmentB: PathPrimitiveSegment,
    tolerance: GeometryTolerance,
  ): PathPrimitiveIntersection[] {
    const vectorA = segmentA.start.getVectorTo(segmentA.end);
    const vectorB = segmentB.start.getVectorTo(segmentB.end);
    const lengthASquared = vectorA.x ** 2 + vectorA.y ** 2;
    const lengthBSquared = vectorB.x ** 2 + vectorB.y ** 2;

    const areaTolerance = this.getAreaTolerance(tolerance);

    if (this.isZero(lengthASquared, areaTolerance) || this.isZero(lengthBSquared, areaTolerance)) {
      return [];
    }

    const segmentBStartParameter = segmentA.start.getVectorTo(segmentB.start).getDotProduct(vectorA) / lengthASquared;
    const segmentBEndParameter = segmentA.start.getVectorTo(segmentB.end).getDotProduct(vectorA) / lengthASquared;
    const overlapStartParameterA = Math.max(0, Math.min(segmentBStartParameter, segmentBEndParameter));
    const overlapEndParameterA = Math.min(1, Math.max(segmentBStartParameter, segmentBEndParameter));

    if (overlapStartParameterA > overlapEndParameterA + tolerance.parameter) {
      return [];
    }

    const clampedStartParameterA = this.clampUnitParameter(overlapStartParameterA);
    const clampedEndParameterA = this.clampUnitParameter(overlapEndParameterA);
    const startPoint = this.getPointAtParameter(segmentA, clampedStartParameterA);
    const endPoint = this.getPointAtParameter(segmentA, clampedEndParameterA);
    const startParameterB = this.clampUnitParameter(
      segmentB.start.getVectorTo(startPoint).getDotProduct(vectorB) / lengthBSquared,
    );
    const endParameterB = this.clampUnitParameter(
      segmentB.start.getVectorTo(endPoint).getDotProduct(vectorB) / lengthBSquared,
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
    const vectorA = segmentA.start.getVectorTo(segmentA.end);
    const vectorB = segmentB.start.getVectorTo(segmentB.end);
    const startOffset = segmentA.start.getVectorTo(segmentB.start);
    const vectorBPoint = new Point({
      x: segmentA.start.x + vectorB.x,
      y: segmentA.start.y + vectorB.y,
    });
    const denominator = vectorA.x * vectorB.y - vectorA.y * vectorB.x;
    const directionOrientation = this.getOrientation(segmentA.start, segmentA.end, vectorBPoint, tolerance);

    if (directionOrientation === 0) {
      const startOrientation = this.getOrientation(segmentA.start, segmentA.end, segmentB.start, tolerance);

      return startOrientation === 0 ? this.getCollinearIntersections(segmentA, segmentB, tolerance) : [];
    }

    const parameterA = (startOffset.x * vectorB.y - startOffset.y * vectorB.x) / denominator;
    const parameterB = (startOffset.x * vectorA.y - startOffset.y * vectorA.x) / denominator;

    if (!this.isInUnitInterval(parameterA, tolerance) || !this.isInUnitInterval(parameterB, tolerance)) {
      return [];
    }

    const clampedParameterA = this.clampUnitParameter(parameterA);
    const clampedParameterB = this.clampUnitParameter(parameterB);

    return [this.createIntersection(segmentA, segmentB, clampedParameterA, clampedParameterB)];
  }
}
