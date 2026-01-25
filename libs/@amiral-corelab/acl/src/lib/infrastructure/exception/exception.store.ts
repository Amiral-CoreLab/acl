import { inject, Injectable } from '@angular/core';
import { ExceptionStoreComputed } from './exception.store.computed';
import { ExceptionStoreMethod } from './exception.store.method';
import { ExceptionStoreState } from './exception.store.state';
import { ExceptionStoreRepository } from './exception.store.repository';

@Injectable({
  providedIn: 'root',
})
export class ExceptionStore {
  protected readonly computed = inject(ExceptionStoreComputed);
  protected readonly method = inject(ExceptionStoreMethod);
  protected readonly state = inject(ExceptionStoreState);

  protected readonly repository = inject(ExceptionStoreRepository);

  public readonly kinds = this.computed.kinds;
  public readonly codes = this.computed.codes;
  public readonly collect = this.method.collect;
  public readonly exceptions = this.state.exceptions.asReadonly();
}
