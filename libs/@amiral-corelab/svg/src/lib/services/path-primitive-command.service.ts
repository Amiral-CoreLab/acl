import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import type { CornerDefinitionArcCenter, PathCommand, Point } from '../classes';
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
   * SVG large-arc flag derived from the angular extent.
   *
   * The SVG `A` command uses this flag to choose the smaller or larger arc section between
   * the same two endpoints.
   */
  private getLargeArcFlag(arc: CornerDefinitionArcCenter): number {
    return Math.abs(arc.deltaAngle) > Math.PI ? 1 : 0;
  }

  /**
   * SVG sweep flag derived from the signed angular extent.
   *
   * The SVG `A` command uses this flag to choose the positive-angle or negative-angle
   * direction around the ellipse.
   */
  private getSweepFlag(arc: CornerDefinitionArcCenter): number {
    return arc.deltaAngle >= 0 ? 1 : 0;
  }

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
      largeArcFlag: this.getLargeArcFlag(primitive),
      sweepFlag: this.getSweepFlag(primitive),
      point: primitive.getEnd(),
    });
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
