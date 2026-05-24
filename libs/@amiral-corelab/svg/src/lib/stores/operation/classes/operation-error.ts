import { Operation } from './operation';
import { OperationSeverityEnum } from '../enums';

export class OperationError<T> extends Operation<T, OperationSeverityEnum.Error> {
  public constructor(message: string, children: Operation<any>[] = []) {
    super(undefined, message, children, OperationSeverityEnum.Error);
  }
}
