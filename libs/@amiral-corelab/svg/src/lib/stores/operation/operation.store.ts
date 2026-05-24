import { getSingleton, Singleton } from '@amiral-corelab/core';
import { OperationStoreMethod } from './operation.store.method';

@Singleton()
export class OperationStore {
  public method = getSingleton(OperationStoreMethod);

  public success = this.method.success;
  public warn = this.method.warn;
  public error = this.method.error;
}
