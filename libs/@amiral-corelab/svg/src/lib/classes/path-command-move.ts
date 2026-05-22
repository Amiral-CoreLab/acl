import type { InitArg } from '@amiral-corelab/core';
import { PathCommand } from './path-command';
import { Point } from './point';

/**
 * SVG `moveto` command.
 *
 * Moves the current point without drawing.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataMovetoCommands
 */
export class PathCommandMove extends PathCommand {
  /**
   * Target point for the move.
   */
  public readonly point: Point;

  /**
   * Creates a moveto command.
   *
   * @param initArg Source move command values.
   */
  public constructor(initArg?: InitArg<PathCommandMove>) {
    super();

    this.point = initArg?.point ?? new Point();
  }

  public getD(): string {
    return `M${this.point.x} ${this.point.y}`;
  }
}
