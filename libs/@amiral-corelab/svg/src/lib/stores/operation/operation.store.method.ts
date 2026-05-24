import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { Operation } from './classes';
import { OperationError, OperationWarn } from './classes';
import { OperationStoreState } from './operation.store.state';
import { OperationSuccess } from './classes/operation-success';

@Singleton()
export class OperationStoreMethod {
  public state = getSingleton(OperationStoreState);

  private record<T extends Operation<any>>(operation: T): T {
    this.state.operations.add(operation);

    return operation;
  }

  public success = <T>(result: T, children: Operation<any>[] = []): OperationSuccess<T> => {
    const operation = new OperationSuccess<T>(result, children);

    return this.record(operation);
  };

  public warn = <T>(message: string, children: Operation<any>[] = []): OperationWarn<T> => {
    const operation = new OperationWarn(message, children);

    return this.record(operation);
  };

  public error = <T>(message: string, children: Operation<any>[] = []): OperationError<T> => {
    const operation = new OperationError(message, children);

    return this.record(operation);
  };
}
