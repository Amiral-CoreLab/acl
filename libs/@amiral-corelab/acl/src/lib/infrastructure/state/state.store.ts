import { inject, Injectable } from '@angular/core';
import { StateStoreState } from './state.store.state';
import { StateStoreMethod } from './state.store.method';
import { StateStoreComputed } from './state.store.computed';
import { StateStoreRepository } from './state.store.repository';

@Injectable({
  providedIn: 'root',
})
export class StateStore {
  protected readonly computed = inject(StateStoreComputed);
  protected readonly method = inject(StateStoreMethod);
  protected readonly state = inject(StateStoreState);

  protected readonly repository = inject(StateStoreRepository);

  public readonly patch = this.method.patch;
  public readonly addDataListener = this.method.addDataListener;
  public readonly createDataSignal = this.method.createDataSignal;
  public readonly getValues = this.method.getValues;
  public readonly listenedKeys = this.state.listenedKeys.asReadonly();
}
