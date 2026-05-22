import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import type { PathCommand, Point } from '../classes';
import { PathCommandArc, PathCommandLine, Segment } from '../classes';
import { AngleService } from './angle.service';

/**
 * Converts path primitives to SVG path commands.
 *
 * A segment becomes an SVG `L` command and a center-parameterized arc becomes an SVG `A`
 * command. Arc axis rotation is converted from radians to the degrees required by SVG path
 * data.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathData
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataEllipticalArcCommands
 */
@Singleton()
export class PathPrimitiveCommandService {
  private readonly angleService = getSingleton(AngleService);

  /**
   * Converts one path primitive to its matching SVG path command.
   *
   * @param primitive Primitive to convert.
   *
   * @returns SVG path command drawing the primitive from the current point.
   */
  public toCommand(primitive: PathPrimitive): PathCommand {
    if (primitive instanceof Segment) {
      return new PathCommandLine({ point: primitive.end });
    }

    return new PathCommandArc({
      radiusX: primitive.radiusX,
      radiusY: primitive.radiusY,
      axisRotation: this.angleService.radiansToDegrees(primitive.axisRotation),
      largeArcFlag: primitive.getLargeArcFlag(),
      sweepFlag: primitive.getSweepFlag(),
      point: primitive.getEnd(),
    });
  }

  public toCommands(primitives: PathPrimitive[]): PathCommand[] {
    return primitives.map((primitive) => this.toCommand(primitive));
  }

  public toD(primitives: PathPrimitive[]): string {
    return this.toCommands(primitives)
      .map((command) => command.getD())
      .join(' ');
  }

  public getStartPoint(primitive: PathPrimitive): Point {
    if (primitive instanceof Segment) {
      return primitive.start;
    }

    return primitive.getStart();
  }

  public getEndPoint(primitive: PathPrimitive): Point {
    if (primitive instanceof Segment) {
      return primitive.end;
    }

    return primitive.getEnd();
  }
}
