import type { InitArg } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import type { PathPrimitiveOrigin } from './path-primitive-origin';
import { PathPrimitiveGraphNode } from './path-primitive-graph-node';
import { Segment } from './segment';

/**
 * Directed edge in a path primitive arrangement graph.
 */
export class PathPrimitiveGraphEdge {
  /**
   * Stable edge index inside one arrangement result.
   */
  public readonly id: number;

  /**
   * Edge start node.
   */
  public readonly from: PathPrimitiveGraphNode;

  /**
   * Edge end node.
   */
  public readonly to: PathPrimitiveGraphNode;

  /**
   * Directed primitive represented by this edge.
   */
  public readonly primitive: PathPrimitive;

  /**
   * Source primitive metadata, when available.
   */
  public readonly origin: PathPrimitiveOrigin | undefined;

  /**
   * Whether this half-edge is the reverse direction of a split primitive.
   */
  public readonly reverse: boolean;

  /**
   * Creates a directed graph edge.
   *
   * @param initArg Source edge values.
   */
  public constructor(initArg?: InitArg<PathPrimitiveGraphEdge>) {
    this.id = initArg?.id ?? 0;
    this.from = initArg?.from ?? new PathPrimitiveGraphNode();
    this.to = initArg?.to ?? new PathPrimitiveGraphNode();
    this.primitive = initArg?.primitive ?? new Segment();
    this.origin = initArg?.origin ?? undefined;
    this.reverse = initArg?.reverse ?? false;
  }
}
