import { computed, inject, Injectable } from '@angular/core';
import { ExceptionStoreState } from './exception.store.state';

@Injectable({
  providedIn: 'root',
})
export class ExceptionStoreComputed {
  protected readonly state = inject(ExceptionStoreState);

  public readonly kinds = computed(() => this.state.exceptions().map((exception) => exception.kind));
  public readonly codes = computed(() => this.state.exceptions().map((exception) => exception.code));
}
