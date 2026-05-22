import { PathCommand } from './path-command';

/**
 * SVG `closepath` command.
 *
 * Closes the current subpath by connecting the current point back to the subpath start.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataClosePathCommand
 */
export class PathCommandClose extends PathCommand {
  public getD(): string {
    return 'Z';
  }
}
