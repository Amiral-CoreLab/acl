import { Segment } from '../classes/segment';
import type { Path } from '../classes';
import { Arc, Point } from '../classes';
import { CommandMove } from '../classes/command-move';
import { CommandLine } from '../classes/command-line';
import { CommandArc } from '../classes/command-arc';
import { CommandClose } from '../classes/command-close';

export type PathGeometry = Segment | Arc;

export function getPathGeometriesUtil(path: Path): PathGeometry[] {
  const [startCommand, ...pathCommands] = path.commands;

  if (!(startCommand instanceof CommandMove)) {
    return [];
  }

  const firstPoint = new Point(startCommand.x, startCommand.y);
  const geometries: PathGeometry[] = [];
  let currentPoint = firstPoint;
  let subpathStart = firstPoint;

  for (const command of pathCommands) {
    if (command instanceof CommandMove) {
      const point = new Point(command.x, command.y);
      currentPoint = point;
      subpathStart = point;
    } else if (command instanceof CommandLine) {
      const end = new Point(command.x, command.y);
      geometries.push(new Segment(currentPoint, end));
      currentPoint = end;
    } else if (command instanceof CommandArc) {
      const end = new Point(command.endX, command.endY);
      const arc = Arc.fromCommand(currentPoint, command);
      geometries.push(arc ?? new Segment(currentPoint, end));
      currentPoint = end;
    } else if (command instanceof CommandClose) {
      geometries.push(new Segment(currentPoint, subpathStart));
      currentPoint = subpathStart;
    }
  }

  return geometries;
}
