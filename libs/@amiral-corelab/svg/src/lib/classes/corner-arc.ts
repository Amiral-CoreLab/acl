import type { SweepFlagEnum } from '../enums';
import { AxisRotationEnum, LargeArcFlagEnum } from '../enums';
import type { CornerGeometry } from './corner-geometry';
import type { Vertex } from './vertex';
import { CommandArc } from './command-arc';
import { CommandMove } from './command-move';
import { CommandLine } from './command-line';
import { Point } from './point';

/**
 * FR: Représente l'arc SVG calculé pour arrondir un coin.
 * EN: Represents the SVG arc computed to round a corner.
 */
export class CornerArc {
  public entry: Point;
  public exit: Point;
  public radius: number;
  public sweepFlag: SweepFlagEnum;
  public vertex: Vertex;

  public constructor(vertex: Vertex, geometry: CornerGeometry, tangentOffset: number) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (tangentOffset <= 0) {
      throw new Error('Corner tangent offset must be greater than zero.');
    }

    const radius = tangentOffset * geometry.tangentFactor;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (radius <= 0 || !Number.isFinite(radius)) {
      throw new Error('Corner radius must be finite and greater than zero.');
    }

    this.entry = new Point(
      vertex.x + geometry.incomingUnitVector.x * tangentOffset,
      vertex.y + geometry.incomingUnitVector.y * tangentOffset,
    );
    this.exit = new Point(
      vertex.x + geometry.outgoingUnitVector.x * tangentOffset,
      vertex.y + geometry.outgoingUnitVector.y * tangentOffset,
    );
    this.radius = radius;
    this.sweepFlag = geometry.sweepFlag;
    this.vertex = vertex;
  }

  public get moveToEntryCommand(): CommandMove {
    return CommandMove.fromPoint(this.entry);
  }

  public get lineToEntryCommand(): CommandLine {
    return CommandLine.fromPoint(this.entry);
  }

  public get arcToExitCommand(): CommandArc {
    return new CommandArc(
      this.radius,
      this.radius,
      AxisRotationEnum.None,
      LargeArcFlagEnum.Small,
      this.sweepFlag,
      this.exit.x,
      this.exit.y,
    );
  }
}
