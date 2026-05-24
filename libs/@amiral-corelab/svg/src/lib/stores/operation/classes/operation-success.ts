import { Operation } from './operation';
import { OperationSeverityEnum } from '../enums';

export class OperationSuccess<T> extends Operation<T, OperationSeverityEnum.Success> {
  public constructor(result: T, children: Operation<any>[] = []) {
    super(result, '', children, OperationSeverityEnum.Success);
  }
}
