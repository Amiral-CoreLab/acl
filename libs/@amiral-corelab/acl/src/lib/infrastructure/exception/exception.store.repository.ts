import { inject, Injectable } from '@angular/core';
import { ExceptionStoreComputed } from './exception.store.computed';
import { ExceptionStoreMethod } from './exception.store.method';
import { ExceptionStoreState } from './exception.store.state';

@Injectable({
  providedIn: 'root',
})
export class ExceptionStoreRepository {
  protected readonly computed = inject(ExceptionStoreComputed);
  protected readonly method = inject(ExceptionStoreMethod);
  protected readonly state = inject(ExceptionStoreState);
}
