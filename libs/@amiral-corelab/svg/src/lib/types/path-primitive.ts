import type { ArcCenter, Segment } from '../classes';

/**
 * Drawable geometry generated from a logical path.
 *
 * A path primitive is either a straight segment or a center-parameterized arc. These objects
 * are still geometry objects; SVG command objects are produced later by `Path.toCommands()`.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataGeneralInformation
 */
export type PathPrimitive = Segment | ArcCenter;
