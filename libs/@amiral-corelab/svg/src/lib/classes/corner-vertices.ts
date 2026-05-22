import type { InitArg } from '@amiral-corelab/core';
import { Vertex } from './vertex';

/**
 * Groups the three vertices needed to resolve a path corner.
 *
 * A corner is evaluated from the previous vertex, the current corner vertex, and the next
 * vertex. This object only stores that local context; path-specific rules such as open path
 * endpoints or closed path wrapping are handled by `Path`.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html
 */
export class CornerVertices {
  /**
   * Vertex before the current corner vertex in the path.
   */
  public readonly previous: Vertex;

  /**
   * Vertex where the corner is defined.
   */
  public readonly current: Vertex;

  /**
   * Vertex after the current corner vertex in the path.
   */
  public readonly next: Vertex;

  /**
   * Creates a corner vertex context.
   *
   * @param initArg Source corner vertices.
   */
  public constructor(initArg?: InitArg<CornerVertices>) {
    this.previous = initArg?.previous ?? new Vertex();
    this.current = initArg?.current ?? new Vertex();
    this.next = initArg?.next ?? new Vertex();
  }
}
