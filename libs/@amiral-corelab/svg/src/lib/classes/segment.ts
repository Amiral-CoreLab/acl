import type { InitArg } from '@amiral-corelab/core';
import { Point } from './point';

/**
 * Represents a finite straight line between two points in the SVG user coordinate system.
 *
 * A segment has an explicit start point and end point. In SVG path data, a straight line
 * command draws a segment from the current point to a target point.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataLinetoCommands
 */
export class Segment {
  /**
   * First point of the finite straight line.
   */
  public readonly start: Point;

  /**
   * Last point of the finite straight line.
   */
  public readonly end: Point;

  /**
   * Creates a segment from optional start and end points.
   *
   * @param initArg Source segment values.
   */
  public constructor(initArg?: InitArg<Segment>) {
    this.start = initArg?.start ?? new Point();
    this.end = initArg?.end ?? new Point();
  }
}
