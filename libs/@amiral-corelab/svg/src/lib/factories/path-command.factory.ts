import { getSingleton, Singleton } from '@amiral-corelab/core';
import {
  CornerDefinitionArcCenter,
  PathCommand,
  PathCommandArc,
  PathCommandClose,
  PathCommandLine,
  PathCommandMove,
  Segment,
} from '../classes';
import { AngleService } from '../services';
import type { PathPrimitive } from '../types';

@Singleton()
export class PathCommandFactory {
  private readonly angleService = getSingleton(AngleService);

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  private getLargeArcFlag(primitive: CornerDefinitionArcCenter): number {
    return Math.abs(primitive.deltaAngle) > Math.PI ? 1 : 0;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  private getSweepFlag(primitive: CornerDefinitionArcCenter): number {
    return primitive.deltaAngle >= 0 ? 1 : 0;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public createMoveToPrimitiveStartCommand(primitive: PathPrimitive): PathCommandMove {
    return new PathCommandMove({ point: primitive.start });
  }

  public fromPrimitive(primitive: PathPrimitive): PathCommand {
    if (primitive instanceof Segment) {
      return new PathCommandLine({ point: primitive.end });
    }

    return new PathCommandArc({
      radiusX: primitive.radiusX,
      radiusY: primitive.radiusY,
      axisRotation: this.angleService.radiansToDegrees(primitive.axisRotation),
      largeArcFlag: this.getLargeArcFlag(primitive),
      sweepFlag: this.getSweepFlag(primitive),
      point: primitive.end,
    });
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public createCloseCommand(): PathCommandClose {
    return new PathCommandClose();
  }
}
