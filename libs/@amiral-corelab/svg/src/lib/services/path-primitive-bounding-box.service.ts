import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import { BoundingBox, CornerDefinitionArcCenter, Segment } from '../classes';
import { ArcCenterGeometryService } from './arc-center-geometry.service';

/**
 * Computes axis-aligned bounding boxes for path primitives.
 *
 * Bounding boxes are used as a broad-phase geometry check before doing more expensive exact
 * intersection calculations. Segment boxes come from their two endpoints. Center arcs use
 * their endpoints plus every x/y extremum of the rotated ellipse that lies on the arc span.
 *
 * @see https://www.w3.org/TR/SVG2/coords.html
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 */
@Singleton()
export class PathPrimitiveBoundingBoxService {
  private readonly arcCenterGeometryService = getSingleton(ArcCenterGeometryService);

  /**
   * Computes a segment bounding box from its endpoints.
   *
   * @param segment Segment to enclose.
   *
   * @returns Axis-aligned segment bounding box.
   */
  private getSegmentBoundingBox(segment: Segment): BoundingBox {
    const minX = Math.min(segment.start.x, segment.end.x);
    const minY = Math.min(segment.start.y, segment.end.y);
    const maxX = Math.max(segment.start.x, segment.end.x);
    const maxY = Math.max(segment.start.y, segment.end.y);

    return BoundingBox.fromMinMax(minX, minY, maxX, maxY);
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
  private getArcCenterBoundingBox(arc: CornerDefinitionArcCenter): BoundingBox {
    const points = [arc.getStart(), arc.getEnd()];
    const candidateAngles = this.arcCenterGeometryService.getArcExtremumAngles(arc);

    for (const angle of candidateAngles) {
      if (this.arcCenterGeometryService.isAngleOnArc(angle, arc.startAngle, arc.deltaAngle)) {
        points.push(arc.getPointAtAngle(angle));
      }
    }

    return BoundingBox.fromPoints(points);
  }

  /**
   * Computes the axis-aligned bounding box of a path primitive.
   *
   * @param primitive Primitive to enclose.
   *
   * @returns Primitive bounding box.
   */
  public getBoundingBox(primitive: PathPrimitive): BoundingBox {
    if (primitive instanceof Segment) {
      return this.getSegmentBoundingBox(primitive);
    }

    if (primitive instanceof CornerDefinitionArcCenter) {
      return this.getArcCenterBoundingBox(primitive);
    }

    return new BoundingBox();
  }
}
