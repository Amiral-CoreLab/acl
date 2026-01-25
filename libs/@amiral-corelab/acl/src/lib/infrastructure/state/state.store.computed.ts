import { inject, Injectable } from '@angular/core';
import { StateStoreState } from './state.store.state';

@Injectable({
  providedIn: 'root',
})
export class StateStoreComputed {
  protected readonly state = inject(StateStoreState);
}
