import { CornerDefinitionArc } from './corner-definition-arc';
import type { InitArg } from '@amiral-corelab/core';
import { Point } from './point';

/**
 * Defines a vertex corner with a circular arc bulge value.
 *
 * A bulge stores a circular arc compactly between `entry` and `exit`. The value is commonly
 * defined as `tan(deltaAngle / 4)`: zero is a straight line, the sign selects the side of the
 * chord, and the magnitude controls the arc extent.
 */
export class CornerDefinitionArcBulge extends CornerDefinitionArc {
  /**
   * Point where the corner arc starts.
   */
  public readonly entry: Point;

  /**
   * Point where the corner arc ends.
   */
  public readonly exit: Point;

  /**
   * Bulge value describing the circular arc curvature and direction.
   */
  public readonly bulge: number;

  /**
   * Creates a bulge arc corner definition.
   *
   * @param initArg Source bulge arc values.
   */
  public constructor(initArg?: InitArg<CornerDefinitionArcBulge>) {
    super();

    this.entry = initArg?.entry ?? new Point();
    this.exit = initArg?.exit ?? new Point();
    this.bulge = initArg?.bulge ?? 0;
  }
}
