import type { CommandArc } from './command-arc';
import { Point } from './point';
import { Vector } from './vector';
import { degreesToRadiansUtil } from '../utils/degrees-to-radians.util';

interface AdjustedArcEndpointParameters {
  readonly x1Prime: number;
  readonly y1Prime: number;
  readonly radiusX: number;
  readonly radiusY: number;
}

/**
 * Represents an elliptical SVG arc in center-parameterized geometry form.
 *
 * SVG path commands store arcs in endpoint form through `CommandArc`: start point, end point,
 * radii, x-axis rotation and flags. That representation is compact for serialization, but it does
 * not directly expose the ellipse center or the angular interval needed for geometry operations.
 *
 * This class stores the converted center form:
 * - `center` is the ellipse center `(cx, cy)`.
 * - `radiusX` and `radiusY` are the usable radii after SVG radius correction.
 * - `axisRotationRad` is the ellipse x-axis rotation in radians.
 * - `startAngle` and `deltaAngle` describe the traversed angular interval.
 *
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 */
export class Arc {
  /**
   * Computes the SVG intermediate coordinates `(x1', y1')` and adjusts the radii when the
   * provided values are too small to connect `start` and `end`.
   *
   * SVG allows insufficient radii: in that case they are scaled proportionally before computing
   * the arc center.
   *
   * @param start Arc start point.
   * @param end Arc end point.
   * @param radiusX SVG requested horizontal radius.
   * @param radiusY SVG requested vertical radius.
   * @param axisRotationRad Ellipse x-axis rotation, in radians.
   *
   * @returns Local `(x1', y1')` coordinates and usable radii.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcCorrectionOutOfRangeRadii
   */
  private static getAdjustedArcEndpointParameters(
    start: Point,
    end: Point,
    radiusX: number,
    radiusY: number,
    axisRotationRad: number,
  ): AdjustedArcEndpointParameters {
    const cosRotation = Math.cos(axisRotationRad);
    const sinRotation = Math.sin(axisRotationRad);
    const halfDeltaX = (start.x - end.x) / 2;
    const halfDeltaY = (start.y - end.y) / 2;
    const x1Prime = cosRotation * halfDeltaX + sinRotation * halfDeltaY;
    const y1Prime = -sinRotation * halfDeltaX + cosRotation * halfDeltaY;

    let adjustedRadiusX = Math.abs(radiusX);
    let adjustedRadiusY = Math.abs(radiusY);

    const radiusScale = x1Prime ** 2 / adjustedRadiusX ** 2 + y1Prime ** 2 / adjustedRadiusY ** 2;

    if (radiusScale > 1) {
      const scale = Math.sqrt(radiusScale);

      adjustedRadiusX *= scale;
      adjustedRadiusY *= scale;
    }

    return {
      x1Prime,
      y1Prime,
      radiusX: adjustedRadiusX,
      radiusY: adjustedRadiusY,
    };
  }

  /**
   * Computes the radicand used by the SVG endpoint-to-center conversion to derive `(cx', cy')`.
   *
   * In the SVG implementation notes, this value is the fraction under the square root in the
   * transformed center formula. It depends on the adjusted radii and on `(x1', y1')`, and it
   * determines how far the center lies from the midpoint in the ellipse-local coordinate system.
   *
   * @param adjustedEndpointParameters Adjusted endpoint parameters and SVG intermediate coordinates `(x1', y1')`.
   *
   * @returns The center-prime radicand, or `undefined` when the denominator is zero.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  private static getCenterPrimeRadicand(adjustedEndpointParameters: AdjustedArcEndpointParameters): number | undefined {
    const radiusXSquared = adjustedEndpointParameters.radiusX ** 2;
    const radiusYSquared = adjustedEndpointParameters.radiusY ** 2;
    const x1PrimeSquared = adjustedEndpointParameters.x1Prime ** 2;
    const y1PrimeSquared = adjustedEndpointParameters.y1Prime ** 2;
    const radicandNumerator =
      radiusXSquared * radiusYSquared - radiusXSquared * y1PrimeSquared - radiusYSquared * x1PrimeSquared;
    const radicandDenominator = radiusXSquared * y1PrimeSquared + radiusYSquared * x1PrimeSquared;

    if (radicandDenominator === 0) {
      return undefined;
    }

    return radicandNumerator / radicandDenominator;
  }

  /**
   * Computes the transformed ellipse center `(cx', cy')` from the SVG endpoint parameters.
   *
   * This is step 2 of the SVG endpoint-to-center conversion. The selected sign depends on the
   * large-arc and sweep flags, which choose one of the possible ellipse centers.
   *
   * @param adjustedEndpointParameters Adjusted radii and SVG intermediate coordinates `(x1', y1')`.
   * @param largeArcFlag SVG large-arc flag `fA`.
   * @param sweepFlag SVG sweep flag `fS`.
   * @param radicand Value under the square root in the SVG `(cx', cy')` formula.
   *
   * @returns The transformed center `(cx', cy')`.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  private static getCenterPrime(
    adjustedEndpointParameters: AdjustedArcEndpointParameters,
    largeArcFlag: number,
    sweepFlag: number,
    radicand: number,
  ): Point {
    const centerPrimeSign = largeArcFlag === sweepFlag ? -1 : 1;
    const centerPrimeCoefficient = centerPrimeSign * Math.sqrt(radicand);
    const centerXPrime =
      (centerPrimeCoefficient * adjustedEndpointParameters.radiusX * adjustedEndpointParameters.y1Prime) /
      adjustedEndpointParameters.radiusY;
    const centerYPrime =
      (-centerPrimeCoefficient * adjustedEndpointParameters.radiusY * adjustedEndpointParameters.x1Prime) /
      adjustedEndpointParameters.radiusX;

    return new Point(centerXPrime, centerYPrime);
  }

  /**
   * Converts the transformed center `(cx', cy')` back into the original SVG coordinate system.
   *
   * This is step 3 of the SVG endpoint-to-center conversion. It rotates the transformed center by
   * the ellipse x-axis rotation, then translates it to the midpoint between the arc endpoints.
   *
   * @param start Arc start point.
   * @param end Arc end point.
   * @param centerPrime Transformed center `(cx', cy')`.
   * @param axisRotationRad Ellipse x-axis rotation, in radians.
   *
   * @returns The arc center `(cx, cy)` in the original coordinate system.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  private static getCenter(start: Point, end: Point, centerPrime: Point, axisRotationRad: number): Point {
    const cosRotation = Math.cos(axisRotationRad);
    const sinRotation = Math.sin(axisRotationRad);
    const midpointX = (start.x + end.x) / 2;
    const midpointY = (start.y + end.y) / 2;
    const centerX = cosRotation * centerPrime.x - sinRotation * centerPrime.y + midpointX;
    const centerY = sinRotation * centerPrime.x + cosRotation * centerPrime.y + midpointY;

    return new Point(centerX, centerY);
  }

  /**
   * Computes the normalized vectors used by SVG to derive the arc start angle and angle extent.
   *
   * These vectors correspond to `v1` and `v2` in the SVG implementation notes:
   * `v1` points from the transformed center `(cx', cy')` to the transformed start point,
   * while `v2` points from the transformed center to the transformed end point.
   *
   * @param adjustedEndpointParameters Adjusted radii and SVG intermediate coordinates `(x1', y1')`.
   * @param centerPrime Transformed center `(cx', cy')`.
   *
   * @returns The normalized start and end vectors used for angle computation.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  private static getVectors(
    adjustedEndpointParameters: AdjustedArcEndpointParameters,
    centerPrime: Point,
  ): { endVector: Vector; startVector: Vector } {
    const startVectorX = (adjustedEndpointParameters.x1Prime - centerPrime.x) / adjustedEndpointParameters.radiusX;
    const startVectorY = (adjustedEndpointParameters.y1Prime - centerPrime.y) / adjustedEndpointParameters.radiusY;
    const endVectorX = (-adjustedEndpointParameters.x1Prime - centerPrime.x) / adjustedEndpointParameters.radiusX;
    const endVectorY = (-adjustedEndpointParameters.y1Prime - centerPrime.y) / adjustedEndpointParameters.radiusY;

    return {
      startVector: new Vector(startVectorX, startVectorY),
      endVector: new Vector(endVectorX, endVectorY),
    };
  }

  /**
   * Computes the SVG arc angle extent `delta theta`.
   *
   * SVG first computes the signed angle from the start vector to the end vector, then adjusts it
   * according to the sweep flag so the angle follows the requested arc direction.
   *
   * @param sweepFlag SVG sweep flag `fS`.
   * @param startVector Vector from the transformed center to the transformed start point.
   * @param endVector Vector from the transformed center to the transformed end point.
   *
   * @returns The arc angle extent, in radians.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  private static getDeltaAngle(sweepFlag: number, startVector: Vector, endVector: Vector): number {
    const fullTurnRad = Math.PI * 2;
    let deltaAngle = Vector.signedAngle(startVector, endVector);

    if (sweepFlag === 0 && deltaAngle > 0) {
      deltaAngle -= fullTurnRad;
    } else if (sweepFlag === 1 && deltaAngle < 0) {
      deltaAngle += fullTurnRad;
    }

    return deltaAngle;
  }

  /**
   * Creates a center-parameterized `Arc` from an SVG arc command.
   *
   * `CommandArc` stores the SVG endpoint representation: radii, x-axis rotation, flags and end
   * point. Geometry operations are easier with the center representation, so this method performs
   * the SVG endpoint-to-center conversion and derives the missing center and angles.
   *
   * Degenerate arc commands with a zero radius cannot form an ellipse and return `undefined`.
   *
   * @param start Current point of the SVG path before the arc command.
   * @param command SVG arc command to convert.
   *
   * @returns A computable `Arc`, or `undefined` when the command is degenerate.
   *
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  public static fromCommand(start: Point, command: CommandArc): Arc | undefined {
    const end = new Point(command.endX, command.endY);

    if (command.radiusX === 0 || command.radiusY === 0) {
      return undefined;
    }

    const axisRotationRad = degreesToRadiansUtil(command.axisRotation);
    const adjustedEndpointParameters = Arc.getAdjustedArcEndpointParameters(
      start,
      end,
      command.radiusX,
      command.radiusY,
      axisRotationRad,
    );
    const centerPrimeRadicand = Arc.getCenterPrimeRadicand(adjustedEndpointParameters);

    if (centerPrimeRadicand === undefined) {
      return undefined;
    }

    const centerPrime = Arc.getCenterPrime(
      adjustedEndpointParameters,
      command.largeArcFlag,
      command.sweepFlag,
      centerPrimeRadicand,
    );
    const center = Arc.getCenter(start, end, centerPrime, axisRotationRad);
    const { startVector, endVector } = Arc.getVectors(adjustedEndpointParameters, centerPrime);
    const startAngle = Vector.signedAngle(new Vector(1, 0), startVector);
    const deltaAngle = Arc.getDeltaAngle(command.sweepFlag, startVector, endVector);

    return new Arc(
      start,
      end,
      center,
      adjustedEndpointParameters.radiusX,
      adjustedEndpointParameters.radiusY,
      axisRotationRad,
      startAngle,
      deltaAngle,
    );
  }

  public readonly start: Point;
  public readonly end: Point;
  public readonly center: Point;
  public readonly radiusX: number;
  public readonly radiusY: number;
  public readonly axisRotationRad: number;
  public readonly startAngle: number;
  public readonly deltaAngle: number;

  public constructor(
    start: Point,
    end: Point,
    center: Point,
    radiusX: number,
    radiusY: number,
    axisRotationRad: number,
    startAngle: number,
    deltaAngle: number,
  ) {
    this.start = start;
    this.end = end;
    this.center = center;
    this.radiusX = radiusX;
    this.radiusY = radiusY;
    this.axisRotationRad = axisRotationRad;
    this.startAngle = startAngle;
    this.deltaAngle = deltaAngle;
  }
}
