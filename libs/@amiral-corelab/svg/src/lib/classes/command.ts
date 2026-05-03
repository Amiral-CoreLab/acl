import type { CommandTypeEnum } from '../enums/command-type.enum';

export abstract class Command {
  public abstract readonly type: CommandTypeEnum;
  public abstract readonly d: string;
}
