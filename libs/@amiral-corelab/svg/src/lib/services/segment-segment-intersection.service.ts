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
}
