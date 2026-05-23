import type { InitArg } from '@amiral-corelab/core';
import { Point } from './point';

/**
 * Node in a path primitive arrangement graph.
 */
export class PathPrimitiveGraphNode {
  /**
   * Stable node index inside one arrangement result.
   */
  public readonly id: number;

  /**
   * Node position in SVG user coordinates.
   */
  public readonly point: Point;

  /**
   * Creates a graph node.
   *
   * @param initArg Source node values.
   */
  public constructor(initArg?: InitArg<PathPrimitiveGraphNode>) {
    this.id = initArg?.id ?? 0;
    this.point = initArg?.point ?? new Point();
  }
}
