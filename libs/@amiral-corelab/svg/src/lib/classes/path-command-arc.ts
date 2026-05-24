import type { InitArg } from '@amiral-corelab/core';
import { PathCommand } from './path-command';
import { Point } from './point';

/**
 * SVG elliptical arc command.
 *
 * Draws an elliptical arc from the current point to the target point.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataEllipticalArcCommands
 */
export class PathCommandArc extends PathCommand {
  /**
   * Horizontal radius of the arc ellipse.
   */
  public readonly radiusX: number;

  /**
   * Vertical radius of the arc ellipse.
   */
  public readonly radiusY: number;

  /**
   * Rotation of the ellipse x-axis relative to the SVG user coordinate system, in degrees.
   *
   * SVG path data serializes `x-axis-rotation` in degrees.
   */
  public readonly axisRotation: number;

  /**
   * SVG large-arc flag.
   *
   * Selects the smaller arc section with `0` or the larger arc section with `1`.
   */
  public readonly largeArcFlag: number;

  /**
   * SVG sweep flag.
   *
   * Selects which direction around the ellipse is drawn.
   */
  public readonly sweepFlag: number;

  /**
   * Arc target point.
   */
  public readonly point: Point;

  /**
   * Serializes this command as an SVG `A` path data fragment.
   *
   * @returns SVG arc command data.
   */
  public get d(): string {
    return `A${this.radiusX} ${this.radiusY} ${this.axisRotation} ${this.largeArcFlag} ${this.sweepFlag} ${this.point.x} ${this.point.y}`;
  }

  /**
   * Creates an elliptical arc command.
   *
   * @param initArg Source arc command values.
   */
  public constructor(initArg?: InitArg<PathCommandArc>) {
    super();

    this.radiusX = initArg?.radiusX ?? 0;
    this.radiusY = initArg?.radiusY ?? 0;
    this.axisRotation = initArg?.axisRotation ?? 0;
    this.largeArcFlag = initArg?.largeArcFlag ?? 0;
    this.sweepFlag = initArg?.sweepFlag ?? 0;
    this.point = initArg?.point ?? new Point();
  }
}
