import { inject, Injectable } from '@angular/core';
import type { Exception } from './exception';
import { ExceptionStoreState } from './exception.store.state';

@Injectable({
  providedIn: 'root',
})
export class ExceptionStoreMethod {
  protected readonly state = inject(ExceptionStoreState);

  public readonly collect = (exception: Exception): Exception => {
    this.state.exceptions.update((exceptions) => [...exceptions, exception]);

    return exception;
  };
}
