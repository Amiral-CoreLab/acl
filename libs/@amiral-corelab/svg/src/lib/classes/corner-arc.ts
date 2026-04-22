import type { SweepFlagEnum } from '../enums';
import { AxisRotationEnum, LargeArcFlagEnum } from '../enums';
import type { CornerGeometry } from './corner-geometry';
import type { Vertex } from './vertex';

export class CornerArc {
  public entryX: number;
  public entryY: number;
  public exitX: number;
  public exitY: number;
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

    this.entryX = vertex.x + geometry.incomingUnitVector.x * tangentOffset;
    this.entryY = vertex.y + geometry.incomingUnitVector.y * tangentOffset;
    this.exitX = vertex.x + geometry.outgoingUnitVector.x * tangentOffset;
    this.exitY = vertex.y + geometry.outgoingUnitVector.y * tangentOffset;
    this.radius = radius;
    this.sweepFlag = geometry.sweepFlag;
    this.vertex = vertex;
  }

  public get moveToEntryCommand(): string {
    return `M${this.entryX} ${this.entryY}`;
  }

  public get lineToEntryCommand(): string {
    return `L${this.entryX} ${this.entryY}`;
  }

  public get arcToExitCommand(): string {
    return `A${this.radius} ${this.radius} ${AxisRotationEnum.None} ${LargeArcFlagEnum.Small} ${this.sweepFlag} ${this.exitX} ${this.exitY}`;
  }

  public get svgPathCommands(): string[] {
    return [this.lineToEntryCommand, this.arcToExitCommand];
  }
}
