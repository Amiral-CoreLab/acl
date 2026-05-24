import { Singleton } from '@amiral-corelab/core';
import type { Point, Segment } from '../classes';
import { BoundingBox } from '../classes';

/**
 * Creates axis-aligned bounding boxes from common geometry inputs.
 */
@Singleton()
export class BoundingBoxFactory {
  /**
   * Creates a bounding box from two corners.
   *
   * The provided coordinates may be in any order; they are normalized so `min` values are
   * lower than `max` values and `width`/`height` remain non-negative.
   *
   * @param minX First horizontal bound.
   * @param minY First vertical bound.
   * @param maxX Second horizontal bound.
   * @param maxY Second vertical bound.
   *
   * @returns Bounding box spanning the provided bounds.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public fromMinMax(minX: number, minY: number, maxX: number, maxY: number): BoundingBox {
    const resolvedMinX = Math.min(minX, maxX);
    const resolvedMinY = Math.min(minY, maxY);
    const resolvedMaxX = Math.max(minX, maxX);
    const resolvedMaxY = Math.max(minY, maxY);

    return new BoundingBox({
      minX: resolvedMinX,
      minY: resolvedMinY,
      maxX: resolvedMaxX,
      maxY: resolvedMaxY,
    });
  }

  /**
   * Creates a bounding box containing all provided points.
   *
   * @param points Points to enclose.
   *
   * @returns Bounding box spanning the point set.
   */
  public fromPoints(points: Point[]): BoundingBox {
    if (points.length === 0) {
      return new BoundingBox();
    }

    const minX = Math.min(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxX = Math.max(...points.map((point) => point.x));
    const maxY = Math.max(...points.map((point) => point.y));

    return this.fromMinMax(minX, minY, maxX, maxY);
  }

  /**
   * Creates a bounding box from a finite straight segment.
   *
   * @param segment Segment to enclose.
   *
   * @returns Bounding box spanning the segment endpoints.
   */
  public fromSegment(segment: Segment): BoundingBox {
    return this.fromMinMax(segment.start.x, segment.start.y, segment.end.x, segment.end.y);
  }
}
