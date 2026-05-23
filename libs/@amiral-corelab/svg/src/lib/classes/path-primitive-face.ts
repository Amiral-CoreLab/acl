import type { InitArg } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import { PathPrimitiveGraphEdge } from './path-primitive-graph-edge';
import { Point } from './point';

/**
 * Closed face extracted from a path primitive arrangement graph.
 */
export class PathPrimitiveFace {
  /**
   * Directed boundary edges in traversal order.
   */
  public readonly edges: PathPrimitiveGraphEdge[];

  /**
   * Directed boundary primitives in traversal order.
   */
  public readonly primitives: PathPrimitive[];

  /**
   * Boundary node points in traversal order.
   */
  public readonly points: Point[];

  /**
   * Signed approximate face area. Positive values are interior faces for the extractor.
   */
  public readonly signedArea: number;

  /**
   * Absolute approximate face area.
   */
  public readonly area: number;

  /**
   * Creates a path primitive face.
   *
   * @param initArg Source face values.
   */
  public constructor(initArg?: InitArg<PathPrimitiveFace>) {
    this.edges = initArg?.edges ?? [];
    this.primitives = initArg?.primitives ?? [];
    this.points = initArg?.points ?? [];
    this.signedArea = initArg?.signedArea ?? 0;
    this.area = initArg?.area ?? Math.abs(this.signedArea);
  }
}
