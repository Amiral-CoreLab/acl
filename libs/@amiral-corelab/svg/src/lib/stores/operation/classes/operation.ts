import type { OperationSeverityEnum } from '../enums';

export abstract class Operation<
  T,
  TSeverity extends OperationSeverityEnum = OperationSeverityEnum,
  TResult = TSeverity extends OperationSeverityEnum.Success ? T : undefined,
> {
  public readonly children: Operation<any>[];
  public readonly result: TResult;
  public readonly message: string;
  public readonly severity: TSeverity;

  protected constructor(result: TResult, message: string, children: Operation<any>[], severity: TSeverity) {
    this.children = children;
    this.result = result;
    this.message = message;
    this.severity = severity;
  }
}
