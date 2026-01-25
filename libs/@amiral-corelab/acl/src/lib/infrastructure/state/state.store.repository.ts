import { inject, Injectable } from '@angular/core';
import { StateStoreComputed } from './state.store.computed';
import { StateStoreMethod } from './state.store.method';
import { StateStoreState } from './state.store.state';

@Injectable({
  providedIn: 'root',
})
export class StateStoreRepository {
  protected readonly computed = inject(StateStoreComputed);
  protected readonly method = inject(StateStoreMethod);
  protected readonly state = inject(StateStoreState);
}
