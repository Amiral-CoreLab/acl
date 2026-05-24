import { Singleton } from '@amiral-corelab/core';
import type { Operation } from './classes';

@Singleton()
export class OperationStoreState {
  public operations = new Set<Operation<any>>();
}
