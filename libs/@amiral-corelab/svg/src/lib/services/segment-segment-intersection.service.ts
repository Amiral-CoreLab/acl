import { Singleton } from '@amiral-corelab/core';
import type { Segment } from '../classes';
import { PathPrimitiveIntersection, Point } from '../classes';

/**
 * Computes exact intersections between two finite straight segments.
 */
@Singleton()
export class SegmentSegmentIntersectionService {
  private readonly epsilon = 1e-9;

  private isZero(value: number): boolean {
    return Math.abs(value) <= this.epsilon;
  }

  private isInUnitInterval(parameter: number): boolean {
    return parameter >= -this.epsilon && parameter <= 1 + this.epsilon;
  }

  private clampUnitParameter(parameter: number): number {
    return Math.max(0, Math.min(1, parameter));
  }

  private isNearlySamePoint(pointA: Point, pointB: Point): boolean {
    return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) <= this.epsilon;
  }

  private getPointAtParameter(segment: Segment, parameter: number): Point {
    return new Point({
      x: segment.start.x + (segment.end.x - segment.start.x) * parameter,
      y: segment.start.y + (segment.end.y - segment.start.y) * parameter,
    });
  }

  private createIntersection(
    segmentA: Segment,
    segmentB: Segment,
    parameterA: number,
    parameterB: number,
  ): PathPrimitiveIntersection {
    return new PathPrimitiveIntersection({
      point: this.getPointAtParameter(segmentA, parameterA),
      primitiveA: segmentA,
      primitiveB: segmentB,
      parameterA,
      parameterB,
    });
  }

  private deduplicateIntersections(intersections: PathPrimitiveIntersection[]): PathPrimitiveIntersection[] {
    return intersections.filter((intersection, index) =>
      intersections.every(
        (otherIntersection, otherIndex) =>
          otherIndex >= index || !this.isNearlySamePoint(intersection.point, otherIntersection.point),
      ),
    );
  }

  private getCollinearIntersections(segmentA: Segment, segmentB: Segment): PathPrimitiveIntersection[] {
    const vectorA = segmentA.start.getVectorTo(segmentA.end);
    const vectorB = segmentB.start.getVectorTo(segmentB.end);
    const lengthASquared = vectorA.x ** 2 + vectorA.y ** 2;
    const lengthBSquared = vectorB.x ** 2 + vectorB.y ** 2;

    if (this.isZero(lengthASquared) || this.isZero(lengthBSquared)) {
      return [];
    }

    const segmentBStartParameter = segmentA.start.getVectorTo(segmentB.start).getDotProduct(vectorA) / lengthASquared;
    const segmentBEndParameter = segmentA.start.getVectorTo(segmentB.end).getDotProduct(vectorA) / lengthASquared;
    const overlapStartParameterA = Math.max(0, Math.min(segmentBStartParameter, segmentBEndParameter));
    const overlapEndParameterA = Math.min(1, Math.max(segmentBStartParameter, segmentBEndParameter));

    if (overlapStartParameterA > overlapEndParameterA + this.epsilon) {
      return [];
    }

    return this.deduplicateIntersections(
      [overlapStartParameterA, overlapEndParameterA].map((parameterA) => {
        const point = this.getPointAtParameter(segmentA, this.clampUnitParameter(parameterA));
        const parameterB = segmentB.start.getVectorTo(point).getDotProduct(vectorB) / lengthBSquared;

        return this.createIntersection(
          segmentA,
          segmentB,
          this.clampUnitParameter(parameterA),
          this.clampUnitParameter(parameterB),
        );
      }),
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
  public getIntersections(segmentA: Segment, segmentB: Segment): PathPrimitiveIntersection[] {
    const vectorA = segmentA.start.getVectorTo(segmentA.end);
    const vectorB = segmentB.start.getVectorTo(segmentB.end);
    const startOffset = segmentA.start.getVectorTo(segmentB.start);
    const denominator = vectorA.x * vectorB.y - vectorA.y * vectorB.x;

    if (this.isZero(denominator)) {
      const collinearity = startOffset.x * vectorA.y - startOffset.y * vectorA.x;

      return this.isZero(collinearity) ? this.getCollinearIntersections(segmentA, segmentB) : [];
    }

    const parameterA = (startOffset.x * vectorB.y - startOffset.y * vectorB.x) / denominator;
    const parameterB = (startOffset.x * vectorA.y - startOffset.y * vectorA.x) / denominator;

    if (!this.isInUnitInterval(parameterA) || !this.isInUnitInterval(parameterB)) {
      return [];
    }

    const clampedParameterA = this.clampUnitParameter(parameterA);
    const clampedParameterB = this.clampUnitParameter(parameterB);

    return [this.createIntersection(segmentA, segmentB, clampedParameterA, clampedParameterB)];
  }
}
