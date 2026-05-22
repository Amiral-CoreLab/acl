import type { InitArg } from '@amiral-corelab/core';
import { CornerDefinitionArc } from './corner-definition-arc';
import { Point } from './point';

/**
 * Defines a vertex corner with SVG elliptical arc endpoint parameters.
 *
 * This format matches the SVG path `A` command: the entry point is the current point before
 * the command, and the exit point is the command target. The radii, axis rotation, and flags
 * select the ellipse and the arc section to draw.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataEllipticalArcCommands
 */
export class CornerDefinitionArcSvg extends CornerDefinitionArc {
  /**
   * Point where the corner arc starts.
   */
  public readonly entry: Point;

  /**
   * Point where the corner arc ends.
   */
  public readonly exit: Point;

  /**
   * Horizontal radius of the SVG arc ellipse.
   */
  public readonly radiusX: number;

  /**
   * Vertical radius of the SVG arc ellipse.
   */
  public readonly radiusY: number;

  /**
   * Rotation of the ellipse x-axis relative to the SVG user coordinate system, in degrees.
   *
   * This matches the SVG `A` command `x-axis-rotation` parameter.
   */
  public readonly axisRotation: number;

  /**
   * SVG large-arc flag selecting the smaller or larger arc section.
   */
  public readonly largeArcFlag: number;

  /**
   * SVG sweep flag selecting the drawing direction around the ellipse.
   */
  public readonly sweepFlag: number;

  /**
   * Creates an SVG endpoint-parameterized arc corner definition.
   *
   * @param initArg Source SVG arc values.
   */
  public constructor(initArg?: InitArg<CornerDefinitionArcSvg>) {
    super();

    this.entry = initArg?.entry ?? new Point();
    this.exit = initArg?.exit ?? new Point();
    this.radiusX = initArg?.radiusX ?? 0;
    this.radiusY = initArg?.radiusY ?? 0;
    this.axisRotation = initArg?.axisRotation ?? 0;
    this.largeArcFlag = initArg?.largeArcFlag ?? 0;
    this.sweepFlag = initArg?.sweepFlag ?? 0;
  }
}
