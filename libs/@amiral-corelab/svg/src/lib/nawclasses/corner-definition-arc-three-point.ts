import { CornerDefinitionArc } from './corner-definition-arc';
import type { InitArg } from '@amiral-corelab/core';
import { Point } from './point';

/**
 * Defines a vertex corner with an arc passing through three points.
 *
 * The three points describe a circular arc when they are not collinear: `entry` is the start
 * point, `middle` is a point on the curve, and `exit` is the end point.
 *
 * @see https://en.wikipedia.org/wiki/Circumcircle
 */
export class CornerDefinitionArcThreePoint extends CornerDefinitionArc {
  /**
   * Point where the corner arc starts.
   */
  public readonly entry: Point;

  /**
   * Point that the circular arc passes through between entry and exit.
   */
  public readonly middle: Point;

  /**
   * Point where the corner arc ends.
   */
  public readonly exit: Point;

  /**
   * Creates a three-point arc corner definition.
   *
   * @param initArg Source three-point arc values.
   */
  public constructor(initArg?: InitArg<CornerDefinitionArcThreePoint>) {
    super();

    this.entry = initArg?.entry ?? new Point();
    this.middle = initArg?.middle ?? new Point();
    this.exit = initArg?.exit ?? new Point();
  }
}
