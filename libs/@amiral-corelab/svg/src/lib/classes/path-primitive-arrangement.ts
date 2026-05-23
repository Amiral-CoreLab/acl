import type { InitArg } from '@amiral-corelab/core';
import { PathPrimitiveFace } from './path-primitive-face';
import { PathPrimitiveGraphEdge } from './path-primitive-graph-edge';
import { PathPrimitiveGraphNode } from './path-primitive-graph-node';
import { PathPrimitiveWithOrigin } from './path-primitive-with-origin';

/**
 * Result of splitting primitives and building an arrangement graph.
 */
export class PathPrimitiveArrangement {
  /**
   * Split primitives used to build the arrangement.
   */
  public readonly primitives: PathPrimitiveWithOrigin[];

  /**
   * Graph nodes.
   */
  public readonly nodes: PathPrimitiveGraphNode[];

  /**
   * Directed graph edges.
   */
  public readonly edges: PathPrimitiveGraphEdge[];

  /**
   * Closed interior faces.
   */
  public readonly faces: PathPrimitiveFace[];

  /**
   * Creates an arrangement result.
   *
   * @param initArg Source arrangement values.
   */
  public constructor(initArg?: InitArg<PathPrimitiveArrangement>) {
    this.primitives = initArg?.primitives ?? [];
    this.nodes = initArg?.nodes ?? [];
    this.edges = initArg?.edges ?? [];
    this.faces = initArg?.faces ?? [];
  }
}
