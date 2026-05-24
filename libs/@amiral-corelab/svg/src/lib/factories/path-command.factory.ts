import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathCommand } from '../classes';
import { PathCommandArc, PathCommandClose, PathCommandLine, PathCommandMove, PathPrimitiveArcCenter } from '../classes';

import { AngleService } from '../services';
import type { PathPrimitive } from '../classes/path-primitive';

/**
 * Converts drawable path primitives into SVG path command objects.
 *
 * Path primitives store geometry in model-friendly units. SVG elliptical arc commands need
 * endpoint parameters, including degree-based axis rotation plus `large-arc` and `sweep`
 * flags, so that conversion lives here instead of on geometry classes.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html#PathData
 * @see https://www.w3.org/TR/SVG2/paths.html#PathDataEllipticalArcCommands
 */
@Singleton()
export class PathCommandFactory {
  private readonly angleService = getSingleton(AngleService);

  /**
   * Gets the SVG large-arc flag for a center-parameterized arc.
   *
   * The flag selects the larger of the two possible endpoint arcs when the absolute angular
   * extent is greater than half a turn.
   *
   * @param primitive Arc primitive to convert.
   *
   * @returns SVG large-arc flag value.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  private getLargeArcFlag(primitive: PathPrimitiveArcCenter): number {
    return Math.abs(primitive.deltaAngle) > Math.PI ? 1 : 0;
  }

  /**
   * Gets the SVG sweep flag for a center-parameterized arc.
   *
   * Positive `deltaAngle` values sweep in the positive-angle direction in this geometry
   * model, which maps to SVG sweep flag `1`.
   *
   * @param primitive Arc primitive to convert.
   *
   * @returns SVG sweep flag value.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  private getSweepFlag(primitive: PathPrimitiveArcCenter): number {
    return primitive.deltaAngle >= 0 ? 1 : 0;
  }

  /**
   * Creates the initial SVG `M` command for a primitive sequence.
   *
   * @param primitive First primitive in drawing order.
   *
   * @returns Moveto command targeting the primitive start point.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public createMoveToPrimitiveStartCommand(primitive: PathPrimitive): PathCommandMove {
    return new PathCommandMove({ point: primitive.start });
  }

  /**
   * Converts one path primitive into its matching drawing command.
   *
   * Segments become SVG `L` commands. Center-parameterized arcs become SVG `A` commands.
   *
   * @param primitive Primitive to convert.
   *
   * @returns SVG path command for the primitive.
   */
  public fromPrimitive(primitive: PathPrimitive): PathCommand {
    if (primitive instanceof PathPrimitiveArcCenter) {
      return new PathCommandArc({
        radiusX: primitive.radiusX,
        radiusY: primitive.radiusY,
        axisRotation: this.angleService.radiansToDegrees(primitive.axisRotation),
        largeArcFlag: this.getLargeArcFlag(primitive),
        sweepFlag: this.getSweepFlag(primitive),
        point: primitive.end,
      });
    }

    return new PathCommandLine({ point: primitive.end });
  }

  /**
   * Creates an SVG closepath command.
   *
   * @returns SVG `Z` command.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public createCloseCommand(): PathCommandClose {
    return new PathCommandClose();
  }
}
