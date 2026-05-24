import type { InitArg } from '@amiral-corelab/core';
import { CornerDefinition } from './corner-definition';
import { Vector } from './vector';

export interface CornerDefinitionBezierInit {
  incomingHandle: Vector;
  outgoingHandle: Vector;
}

/**
 * Defines editable Bezier handles attached to a path vertex.
 *
 * Handles are stored as vectors relative to the vertex, not as absolute points. This keeps
 * the handle intent attached to the vertex when the vertex moves. A zero vector represents
 * a collapsed handle.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataCubicBezierCommands
 */
export class CornerDefinitionBezier extends CornerDefinition {
  /**
   * Relative handle used by the incoming curve segment.
   */
  public readonly incomingHandle: Vector;

  /**
   * Relative handle used by the outgoing curve segment.
   */
  public readonly outgoingHandle: Vector;

  /**
   * Creates a Bezier corner definition from optional handle vectors.
   *
   * @param initArg Source Bezier handle values.
   */
  public constructor(initArg?: InitArg<CornerDefinitionBezierInit>) {
    super();

    this.incomingHandle = initArg?.incomingHandle ?? new Vector();
    this.outgoingHandle = initArg?.outgoingHandle ?? new Vector();
  }
}
