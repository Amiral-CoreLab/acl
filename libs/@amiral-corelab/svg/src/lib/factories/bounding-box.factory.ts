import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { Point } from '../classes';
import { BoundingBox, PathPrimitiveArcCenter, PathPrimitiveSegment } from '../classes';
import { ArcCenterService } from '../services';
import type { PathPrimitive } from '../classes/path-primitive';

/**
 * Creates axis-aligned bounding boxes from common geometry inputs.
 */
@Singleton()
export class BoundingBoxFactory {
  private readonly arcCenterGeometryService = getSingleton(ArcCenterService);

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
   * Creates a bounding box containing all provided bounding boxes.
   *
   * @param boundingBoxes Boxes to enclose.
   *
   * @returns Bounding box spanning the box set.
   */
  public fromBoundingBoxes(boundingBoxes: BoundingBox[]): BoundingBox {
    if (boundingBoxes.length === 0) {
      return new BoundingBox();
    }

    return this.fromMinMax(
      Math.min(...boundingBoxes.map((boundingBox) => boundingBox.minX)),
      Math.min(...boundingBoxes.map((boundingBox) => boundingBox.minY)),
      Math.max(...boundingBoxes.map((boundingBox) => boundingBox.maxX)),
      Math.max(...boundingBoxes.map((boundingBox) => boundingBox.maxY)),
    );
  }

  /**
   * Creates a bounding box from a finite straight segment.
   *
   * @param segment Segment to enclose.
   *
   * @returns Bounding box spanning the segment endpoints.
   */
  public fromSegment(segment: PathPrimitiveSegment): BoundingBox {
    return this.fromMinMax(segment.start.x, segment.start.y, segment.end.x, segment.end.y);
  }

  /**
   * Computes a center-parameterized arc bounding box.
   *
   * The box contains the arc endpoints and any rotated ellipse extrema that are actually on
   * the arc span. This keeps the box tight enough for broad-phase intersection filtering.
   *
   * @param arc Arc to enclose.
   *
   * @returns Axis-aligned arc bounding box.
   */
  public fromArcCenter(arc: PathPrimitiveArcCenter): BoundingBox {
    const points = [arc.start, arc.end];
    const candidateAngles = this.arcCenterGeometryService.getArcExtremumAngles(arc);

    for (const angle of candidateAngles) {
      if (this.arcCenterGeometryService.isAngleOnArc(angle, arc.startAngle, arc.deltaAngle)) {
        points.push(arc.getPointAtAngle(angle));
      }
    }

    return this.fromPoints(points);
  }

  /**
   * Computes the axis-aligned bounding box of a path primitive.
   *
   * @param primitive Primitive to enclose.
   *
   * @returns Primitive bounding box.
   */
  public fromPrimitive(primitive: PathPrimitive): BoundingBox {
    if (primitive instanceof PathPrimitiveSegment) {
      return this.fromSegment(primitive);
    }

    if (primitive instanceof PathPrimitiveArcCenter) {
      return this.fromArcCenter(primitive);
    }

    return new BoundingBox();
  }
}
