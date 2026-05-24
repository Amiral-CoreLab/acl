import type { InitArg } from '@amiral-corelab/core';
import { Point } from './point';
import type { CornerDefinitionRadius } from './corner-definition-radius';
import { Vector } from './vector';

export interface CornerDefinitionRadiusGeometryInit {
  previousPoint: Point;
  currentPoint: Point;
  nextPoint: Point;
  radius: number;
  incomingVector: Vector;
  outgoingVector: Vector;
  incomingUnitVector: Vector;
  outgoingUnitVector: Vector;
  cornerAngle: number;
  halfAngleTangent: number;
  tangentOffset: number;
}

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
  public get entry(): Point {
    return this.currentPoint.moveAlongVector(this.incomingUnitVector, this.tangentOffset);
  }

  /**
   * Point where the rounded corner arc ends on the outgoing edge.
   */
  public get exit(): Point {
    return this.currentPoint.moveAlongVector(this.outgoingUnitVector, this.tangentOffset);
  }

  /**
   * Creates radius corner geometry from already-computed values.
   *
   * Calculation should be done by a dedicated factory method so the constructor remains a
   * simple object initializer.
   *
   * @param initArg Source radius geometry values.
   */
  public constructor(initArg?: InitArg<CornerDefinitionRadiusGeometryInit>) {
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
    });
  }
}
