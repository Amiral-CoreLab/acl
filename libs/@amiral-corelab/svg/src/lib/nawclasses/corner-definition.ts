/**
 * Base class for a path vertex corner definition.
 *
 * A corner definition describes how the corner at a vertex should be handled. It can be a
 * contextual definition, such as a radius that needs neighboring vertices, or an explicit
 * arc definition that already carries enough data to describe the curve.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html
 */
export abstract class CornerDefinition {}
