/**
 * Base class for SVG path commands.
 *
 * Each command can serialize itself to the corresponding SVG path data fragment.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathData
 */
export abstract class PathCommand {
  /**
   * SVG path data fragment for this command.
   */
  public abstract getD(): string;
}
