import { Singleton } from '@amiral-corelab/core';
import type { CornerDefinitionRadiusGeometry } from '../classes';
import { CornerDefinitionArcCenter, Vector } from '../classes';

@Singleton()
export class CornerDefinitionArcCenterFactory {
  /**
   * Converts this fitted radius geometry to a center-parameterized circular arc.
   *
   * The arc center lies on the corner angle bisector. Its distance from the corner point is
   * derived from the radius and half-angle sine. The signed delta angle preserves the drawing
   * direction from entry to exit.
   *
   * @returns Center-parameterized arc for this rounded corner.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  public fromRadiusGeometry(radiusGeometry: CornerDefinitionRadiusGeometry): CornerDefinitionArcCenter {
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

    return new CornerDefinitionArcCenter({
      center,
      radiusX: radiusGeometry.radius,
      radiusY: radiusGeometry.radius,
      axisRotation: 0,
      startAngle,
      deltaAngle,
    });
  }
}
