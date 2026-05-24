import { Operation } from './operation';
import { OperationSeverityEnum } from '../enums';

export class OperationWarn<T> extends Operation<T, OperationSeverityEnum.Warning> {
  public constructor(message: string, children: Operation<any>[] = []) {
    super(undefined, message, children, OperationSeverityEnum.Warning);
  }
}
