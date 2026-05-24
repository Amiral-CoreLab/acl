import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import { ArcCenter, BoundingBox, Segment } from '../classes';
import { ArcCenterService } from './arc-center.service';
import { BoundingBoxFactory } from '../factories';

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
  private readonly boundingBoxFactory = getSingleton(BoundingBoxFactory);
  private readonly arcCenterGeometryService = getSingleton(ArcCenterService);

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
  private getArcCenterBoundingBox(arc: ArcCenter): BoundingBox {
    const points = [arc.start, arc.end];
    const candidateAngles = this.arcCenterGeometryService.getArcExtremumAngles(arc);

    for (const angle of candidateAngles) {
      if (this.arcCenterGeometryService.isAngleOnArc(angle, arc.startAngle, arc.deltaAngle)) {
        points.push(arc.getPointAtAngle(angle));
      }
    }

    return this.boundingBoxFactory.fromPoints(points);
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
      return this.boundingBoxFactory.fromSegment(primitive);
    }

    if (primitive instanceof ArcCenter) {
      return this.getArcCenterBoundingBox(primitive);
    }

    return new BoundingBox();
  }
}
