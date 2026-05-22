import { CornerDefinition } from './corner-definition';

/**
 * Base class for corner definitions described by an arc.
 *
 * Arc corner definitions already describe a curved replacement for the sharp vertex corner.
 * Concrete subclasses choose the arc parameterization, such as SVG endpoint parameters,
 * center parameters, three points, or a bulge value.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataEllipticalArcCommands
 */
export abstract class CornerDefinitionArc extends CornerDefinition {}
