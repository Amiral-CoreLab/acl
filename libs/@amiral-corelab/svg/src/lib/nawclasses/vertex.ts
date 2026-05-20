import type { InitArg } from '@amiral-corelab/core';
import { Point } from './point';
import type { CornerDefinition } from './corner-definition';

/**
 * Represents a logical vertex of a path.
 *
 * A vertex is a point used to define the intended outline of a path. It may carry a corner
 * definition describing how the corner at this point should be handled, but it does not store
 * resolved drawing geometry such as segments or computed arcs.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html
 */
export class Vertex extends Point {
  /**
   * Optional definition describing how the corner at this vertex should be resolved.
   */
  public readonly cornerDefinition: CornerDefinition | undefined;

  /**
   * Creates a path vertex from optional point and corner definition values.
   *
   * @param initArg Source vertex values.
   */
  public constructor(initArg?: InitArg<Vertex>) {
    super(initArg);

    this.cornerDefinition = initArg?.cornerDefinition ?? undefined;
  }
}
