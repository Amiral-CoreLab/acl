import { PathCommand } from './path-command';

/**
 * SVG `closepath` command.
 *
 * Closes the current subpath by connecting the current point back to the subpath start.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataClosePathCommand
 */
export class PathCommandClose extends PathCommand {
  /**
   * Serializes this command as an SVG `Z` path data fragment.
   *
   * @returns SVG close command data.
   */
  public getD(): string {
    return 'Z';
  }
}
