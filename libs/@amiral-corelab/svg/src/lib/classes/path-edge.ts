import type { InitArg } from '@amiral-corelab/core';
import { Vertex } from './vertex';

/**
 * Represents a logical directed edge between two path vertices.
 *
 * A path edge describes the intended connection from one vertex to the next in the path
 * model. It is not necessarily the final straight segment drawn in SVG: corner handling may
 * shorten this connection and insert arcs around either endpoint.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html
 */
export class PathEdge {
  /**
   * Source vertex of the logical path connection.
   */
  public from: Vertex;

  /**
   * Target vertex of the logical path connection.
   */
  public to: Vertex;

  /**
   * Creates a path edge from optional source and target vertices.
   *
   * @param initArg Source path edge values.
   */
  public constructor(initArg?: InitArg<PathEdge>) {
    this.from = initArg?.from ?? new Vertex();
    this.to = initArg?.to ?? new Vertex();
  }
}
