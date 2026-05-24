import type { InitArg } from '@amiral-corelab/core';
import { assert } from '@amiral-corelab/core';
import { Point } from './point';
import { CornerDefinitionRadius } from './corner-definition-radius';
import { Vector } from './vector';
import type { CornerVertices } from './corner-vertices';
import { CornerDefinitionArcCenter } from './corner-definition-arc-center';

/**
 * Stores the local geometry computed from a radius-based corner definition.
 *
 * A radius corner is resolved from three points: the previous point, the current corner
 * point, and the next point. The radius is converted into tangent points on the incoming
 * and outgoing edges. These tangent points become the entry and exit points of the rounded
 * corner arc.
 *
 * The same geometric data can later be converted to a center-parameterized arc for
 * calculations, or to SVG endpoint parameters for an `A` path command.
 *
 * @see https://www.w3.org/TR/SVG/shapes.html#RectElement
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 */
export class CornerDefinitionRadiusGeometry {
  private static readonly epsilon = 1e-9;

  /**
   * Point before the corner point in the path.
   */
  public readonly previousPoint: Point;

  /**
   * Point where the radius-based corner is defined.
   */
  public readonly currentPoint: Point;

  /**
   * Point after the corner point in the path.
   */
  public readonly nextPoint: Point;

  /**
   * Requested circular radius for the rounded corner.
   */
  public readonly radius: CornerDefinitionRadius['radius'];

  /**
   * Vector from the current point toward the previous point.
   */
  public readonly incomingVector: Vector;

  /**
   * Vector from the current point toward the next point.
   */
  public readonly outgoingVector: Vector;

  /**
   * Normalized incoming direction used to place the arc entry point.
   */
  public readonly incomingUnitVector: Vector;

  /**
   * Normalized outgoing direction used to place the arc exit point.
   */
  public readonly outgoingUnitVector: Vector;

  /**
   * Angle between the incoming and outgoing directions, in radians.
   */
  public readonly cornerAngle: number;

  /**
   * Tangent of half the corner angle, used to convert radius to tangent offset.
   */
  public readonly halfAngleTangent: number;

  /**
   * Distance from the current point to the arc entry and exit points along their edges.
   */
  public readonly tangentOffset: number;

  /**
   * Point where the rounded corner arc starts on the incoming edge.
   */
  public readonly entry: Point;

  /**
   * Point where the rounded corner arc ends on the outgoing edge.
   */
  public readonly exit: Point;

  /**
   * Creates radius corner geometry from already-computed values.
   *
   * Calculation should be done by a dedicated factory method so the constructor remains a
   * simple object initializer.
   *
   * @param initArg Source radius geometry values.
   */
  public constructor(initArg?: InitArg<CornerDefinitionRadiusGeometry>) {
    this.previousPoint = initArg?.previousPoint ?? new Point();
    this.currentPoint = initArg?.currentPoint ?? new Point();
    this.nextPoint = initArg?.nextPoint ?? new Point();
    this.radius = initArg?.radius ?? 0;
    this.incomingVector = initArg?.incomingVector ?? new Vector();
    this.outgoingVector = initArg?.outgoingVector ?? new Vector();
    this.incomingUnitVector = initArg?.incomingUnitVector ?? new Vector();
    this.outgoingUnitVector = initArg?.outgoingUnitVector ?? new Vector();
    this.cornerAngle = initArg?.cornerAngle ?? 0;
    this.halfAngleTangent = initArg?.halfAngleTangent ?? 0;
    this.tangentOffset = initArg?.tangentOffset ?? 0;
    this.entry = initArg?.entry ?? new Point();
    this.exit = initArg?.exit ?? new Point();
  }

  /**
   * Creates a copy fitted to a different tangent offset.
   *
   * Fitting changes the consumed distance on both adjacent edges. The tangent points and
   * effective radius are recomputed from the stored corner angle and unit directions.
   *
   * @param tangentOffset Fitted distance from the corner point to entry and exit.
   *
   * @returns Radius geometry rebuilt with the fitted tangent offset.
   */
  public withTangentOffset(tangentOffset: number): CornerDefinitionRadiusGeometry {
    const radius = tangentOffset * this.halfAngleTangent;
    const entry = this.currentPoint.moveAlongVector(this.incomingUnitVector, tangentOffset);
    const exit = this.currentPoint.moveAlongVector(this.outgoingUnitVector, tangentOffset);

    return new CornerDefinitionRadiusGeometry({
      previousPoint: this.previousPoint,
      currentPoint: this.currentPoint,
      nextPoint: this.nextPoint,
      radius,
      incomingVector: this.incomingVector,
      outgoingVector: this.outgoingVector,
      incomingUnitVector: this.incomingUnitVector,
      outgoingUnitVector: this.outgoingUnitVector,
      cornerAngle: this.cornerAngle,
      halfAngleTangent: this.halfAngleTangent,
      tangentOffset,
      entry,
      exit,
    });
  }

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
  public toArcCenter(): CornerDefinitionArcCenter {
    const bisectorVector = new Vector({
      x: this.incomingUnitVector.x + this.outgoingUnitVector.x,
      y: this.incomingUnitVector.y + this.outgoingUnitVector.y,
    }).normalize();
    const centerDistance = this.radius / Math.sin(this.cornerAngle / 2);
    const center = this.currentPoint.moveAlongVector(bisectorVector, centerDistance);
    const startVector = Vector.fromPoints(center, this.entry);
    const endVector = Vector.fromPoints(center, this.exit);
    const startAngle = Math.atan2(startVector.y, startVector.x);
    const deltaAngle = startVector.getSignedAngleTo(endVector);

    return new CornerDefinitionArcCenter({
      center,
      radiusX: this.radius,
      radiusY: this.radius,
      axisRotation: 0,
      startAngle,
      deltaAngle,
    });
  }

  /**
   * Computes radius corner geometry from the previous, current, and next path vertices.
   *
   * The calculation follows the standard rounded-corner construction: vectors are built from
   * the corner point to its neighboring points, the corner angle is measured between those
   * vectors, and the radius is converted to tangent points along both adjacent edges.
   *
   * SVG rounded rectangles expose the same radius idea through `rx` and `ry`; SVG arc
   * implementation notes use vector angles as the basis for arc parameter conversion.
   *
   * @param cornerVertices Previous, current, and next vertices around the corner.
   *
   * @returns Computed radius geometry.
   *
   * @see https://www.w3.org/TR/SVG/shapes.html#RectElement
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  public static fromCornerVertices(cornerVertices: CornerVertices): CornerDefinitionRadiusGeometry {
    const { previous, current, next } = cornerVertices;
    const { cornerDefinition } = current;

    assert(
      cornerDefinition instanceof CornerDefinitionRadius,
      'Current vertex corner definition must be radius-based.',
    );
    assert(cornerDefinition.radius > 0, 'Corner radius must be greater than zero.');

    // 1. Build the two edge directions around the corner.
    const incomingVector = Vector.fromPoints(current, previous);
    const outgoingVector = Vector.fromPoints(current, next);

    assert(incomingVector.getLength() > 0, 'Incoming edge must have a positive length.');
    assert(outgoingVector.getLength() > 0, 'Outgoing edge must have a positive length.');

    // 2. Normalize directions so dot/cross products describe only angle and orientation.
    const incomingUnitVector = incomingVector.normalize();
    const outgoingUnitVector = outgoingVector.normalize();

    // 3. Compute the corner angle. Clamp avoids NaN from floating point drift around [-1, 1].
    const cornerAngle = incomingVector.getUnsignedAngleTo(outgoingVector);

    assert(
      cornerAngle > CornerDefinitionRadiusGeometry.epsilon,
      'Incoming and outgoing edges must not have the same direction.',
    );
    assert(
      Math.abs(Math.PI - cornerAngle) > CornerDefinitionRadiusGeometry.epsilon,
      'Incoming and outgoing edges must not be opposite directions.',
    );

    // 4. Convert the requested radius to the tangent offset along both adjacent edges.
    const halfAngleTangent = Math.tan(cornerAngle / 2);
    const tangentOffset = cornerDefinition.radius / halfAngleTangent;

    assert(
      Number.isFinite(halfAngleTangent) && Number.isFinite(tangentOffset) && tangentOffset > 0,
      'Corner radius and angle must produce a valid tangent offset.',
    );

    // 5. Place the tangent points that become the rounded arc entry and exit.
    const entry = current.moveAlongVector(incomingUnitVector, tangentOffset);
    const exit = current.moveAlongVector(outgoingUnitVector, tangentOffset);

    return new CornerDefinitionRadiusGeometry({
      previousPoint: previous,
      currentPoint: current,
      nextPoint: next,
      radius: cornerDefinition.radius,
      incomingVector,
      outgoingVector,
      incomingUnitVector,
      outgoingUnitVector,
      cornerAngle,
      halfAngleTangent,
      tangentOffset,
      entry,
      exit,
    });
  }
}
