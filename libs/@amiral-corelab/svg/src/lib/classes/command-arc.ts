import { CommandTypeEnum } from '../enums/command-type.enum';
import { Command } from './command';

export class CommandArc extends Command {
  public readonly type = CommandTypeEnum.Arc;

  public readonly radiusX: number;
  public readonly radiusY: number;
  public readonly axisRotation: number;
  public readonly largeArcFlag: number;
  public readonly sweepFlag: number;
  public readonly endX: number;
  public readonly endY: number;

  public constructor(
    radiusX: number,
    radiusY: number,
    axisRotation: number,
    largeArcFlag: number,
    sweepFlag: number,
    endX: number,
    endY: number,
  ) {
    super();

    this.radiusX = radiusX;
    this.radiusY = radiusY;
    this.axisRotation = axisRotation;
    this.largeArcFlag = largeArcFlag;
    this.sweepFlag = sweepFlag;
    this.endX = endX;
    this.endY = endY;
  }

  public get d(): string {
    return `${this.type}${this.radiusX} ${this.radiusY} ${this.axisRotation} ${this.largeArcFlag} ${this.sweepFlag} ${this.endX} ${this.endY}`;
  }
}
