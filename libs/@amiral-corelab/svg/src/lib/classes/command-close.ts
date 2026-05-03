import { CommandTypeEnum } from '../enums/command-type.enum';
import { Command } from './command';

export class CommandClose extends Command {
  public readonly type = CommandTypeEnum.Close;

  public get d(): string {
    return this.type;
  }
}
