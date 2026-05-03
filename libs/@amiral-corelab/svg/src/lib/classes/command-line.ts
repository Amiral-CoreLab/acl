import { CommandTypeEnum } from '../enums/command-type.enum';
import { Command } from './command';
import type { Point } from '@amiral-corelab/svg';

export class CommandLine extends Command {
  public static fromPoint(point: Point): CommandLine {
    return new CommandLine(point.x, point.y);
  }

  public readonly type = CommandTypeEnum.Line;

  public readonly x: number;
  public readonly y: number;

  public constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;
  }

  public get d(): string {
    return `${this.type}${this.x} ${this.y}`;
  }
}
