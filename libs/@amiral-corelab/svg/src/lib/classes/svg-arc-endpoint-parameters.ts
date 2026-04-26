import { Point } from './point';

/**
 * FR: Représente les paramètres numériques d'une commande SVG d'arc `A`.
 * EN: Represents the numeric parameters of an SVG `A` arc command.
 */
export class SvgArcEndpointParameters {
  public readonly radiusX: number;
  public readonly radiusY: number;
  public readonly axisRotation: number;
  public readonly largeArcFlag: number;
  public readonly sweepFlag: number;
  public readonly end: Point;

  public constructor(
    radiusX: number,
    radiusY: number,
    axisRotation: number,
    largeArcFlag: number,
    sweepFlag: number,
    end: Point,
  ) {
    this.radiusX = radiusX;
    this.radiusY = radiusY;
    this.axisRotation = axisRotation;
    this.largeArcFlag = largeArcFlag;
    this.sweepFlag = sweepFlag;
    this.end = end;
  }
}
