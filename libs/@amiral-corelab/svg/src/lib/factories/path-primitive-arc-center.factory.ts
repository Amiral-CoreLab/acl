import { Singleton } from '@amiral-corelab/core';
import type { CornerDefinitionRadiusGeometry } from '../classes';
import { PathPrimitiveArcCenter, Vector } from '../classes';

/**
 * Creates center-parameterized arc primitives from resolved corner geometry.
 */
@Singleton()
export class PathPrimitiveArcCenterFactory {
  /**
   * Converts fitted radius geometry to a center-parameterized circular arc primitive.
   *
   * The arc center lies on the corner angle bisector. Its distance from the corner point is
   * derived from the radius and half-angle sine. The signed delta angle preserves the drawing
   * direction from entry to exit.
   *
   * @param radiusGeometry Resolved radius corner geometry.
   *
   * @returns Center-parameterized arc primitive for this rounded corner.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public fromRadiusGeometry(radiusGeometry: CornerDefinitionRadiusGeometry): PathPrimitiveArcCenter {
    const bisectorVector = new Vector({
      x: radiusGeometry.incomingUnitVector.x + radiusGeometry.outgoingUnitVector.x,
      y: radiusGeometry.incomingUnitVector.y + radiusGeometry.outgoingUnitVector.y,
    }).normalize();
    const centerDistance = radiusGeometry.radius / Math.sin(radiusGeometry.cornerAngle / 2);
    const center = radiusGeometry.currentPoint.moveAlongVector(bisectorVector, centerDistance);
    const startVector = Vector.fromPoints(center, radiusGeometry.entry);
    const endVector = Vector.fromPoints(center, radiusGeometry.exit);
    const startAngle = Math.atan2(startVector.y, startVector.x);
    const deltaAngle = startVector.getSignedAngleTo(endVector);

    return new PathPrimitiveArcCenter({
      center,
      radiusX: radiusGeometry.radius,
      radiusY: radiusGeometry.radius,
      axisRotation: 0,
      startAngle,
      deltaAngle,
    });
  }
}
