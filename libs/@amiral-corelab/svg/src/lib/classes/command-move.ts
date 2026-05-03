import { CommandTypeEnum } from '../enums/command-type.enum';
import { Command } from './command';
import type { Point } from './point';

export class CommandMove extends Command {
  public static fromPoint(point: Point): CommandMove {
    return new CommandMove(point.x, point.y);
  }

  public readonly type = CommandTypeEnum.Move;

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
