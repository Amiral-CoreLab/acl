import { Singleton } from '@amiral-corelab/core';
import type { CornerDefinitionRadiusGeometry } from '../classes';
import { PathPrimitiveArcCenter, Vector } from '../classes';

/**
 * Creates center-parameterized arc primitives from resolved corner geometry.
 */
@Singleton()
export class PathPrimitiveArcCenterFactory {
  private static getAngleBisectorVector(radiusGeometry: CornerDefinitionRadiusGeometry): Vector {
    return radiusGeometry.incomingUnitVector.add(radiusGeometry.outgoingUnitVector).normalize();
  }

  private static getCenterDistance(radiusGeometry: CornerDefinitionRadiusGeometry): number {
    return radiusGeometry.radius / Math.sin(radiusGeometry.cornerAngle / 2);
  }

  private static getStartAngle(
    center: CornerDefinitionRadiusGeometry['currentPoint'],
    entry: CornerDefinitionRadiusGeometry['entry'],
  ): number {
    const startVector = Vector.fromPoints(center, entry);

    return Math.atan2(startVector.y, startVector.x);
  }

  private static getDeltaAngle(
    center: CornerDefinitionRadiusGeometry['currentPoint'],
    entry: CornerDefinitionRadiusGeometry['entry'],
    exit: CornerDefinitionRadiusGeometry['exit'],
  ): number {
    const startVector = Vector.fromPoints(center, entry);
    const endVector = Vector.fromPoints(center, exit);

    return startVector.getSignedAngleTo(endVector);
  }

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
    const bisectorVector = PathPrimitiveArcCenterFactory.getAngleBisectorVector(radiusGeometry);
    const centerDistance = PathPrimitiveArcCenterFactory.getCenterDistance(radiusGeometry);
    const center = radiusGeometry.currentPoint.moveAlongVector(bisectorVector, centerDistance);
    const startAngle = PathPrimitiveArcCenterFactory.getStartAngle(center, radiusGeometry.entry);
    const deltaAngle = PathPrimitiveArcCenterFactory.getDeltaAngle(center, radiusGeometry.entry, radiusGeometry.exit);

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
