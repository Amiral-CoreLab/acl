import type { InitArg } from '@amiral-corelab/core';
import { PathCommand } from './path-command';
import { Point } from './point';

/**
 * SVG `lineto` command.
 *
 * Draws a straight line from the current point to the target point.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataLinetoCommands
 */
export class PathCommandLine extends PathCommand {
  /**
   * Target point for the line.
   */
  public readonly point: Point;

  /**
   * Serializes this command as an SVG `L` path data fragment.
   *
   * @returns SVG line command data.
   */
  public get d(): string {
    return `L${this.point.x} ${this.point.y}`;
  }

  /**
   * Creates a lineto command.
   *
   * @param initArg Source line command values.
   */
  public constructor(initArg?: InitArg<PathCommandLine>) {
    super();

    this.point = initArg?.point ?? new Point();
  }
}
