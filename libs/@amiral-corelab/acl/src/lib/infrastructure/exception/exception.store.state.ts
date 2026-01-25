import { Injectable, signal } from '@angular/core';
import type { Exception } from './exception';

@Injectable({
  providedIn: 'root',
})
export class ExceptionStoreState {
  public readonly exceptions = signal<Exception[]>([]);
}
