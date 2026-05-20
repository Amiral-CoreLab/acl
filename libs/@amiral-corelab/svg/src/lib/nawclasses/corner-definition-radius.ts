import type { InitArg } from '@amiral-corelab/core';
import { CornerDefinition } from './corner-definition';

/**
 * Defines a vertex corner by a circular radius.
 *
 * This definition does not store the final arc points. The path resolver uses the radius
 * together with the previous, current, and next vertices to compute the arc entry point,
 * exit point, and SVG arc parameters.
 *
 * SVG uses radius values for rounded rectangle corners through `rx` and `ry`.
 *
 * @see https://www.w3.org/TR/SVG/shapes.html#RectElement
 */
export class CornerDefinitionRadius extends CornerDefinition {
  /**
   * Requested circular radius for the vertex corner.
   */
  public readonly radius: number;

  /**
   * Creates a radius-based corner definition.
   *
   * @param initArg Source radius values.
   */
  public constructor(initArg?: InitArg<CornerDefinitionRadius>) {
    super();

    this.radius = initArg?.radius ?? 0;
  }
}
