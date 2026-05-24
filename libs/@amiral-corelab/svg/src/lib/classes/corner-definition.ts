/**
 * Base class for a path vertex corner definition.
 *
 * A corner definition describes how the corner at a vertex should be handled. It can be a
 * contextual definition, such as a radius that needs neighboring vertices, or editable
 * handle data that can later be resolved into drawable path primitives.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html
 */
export abstract class CornerDefinition {}
