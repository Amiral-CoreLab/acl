import { Injectable, signal } from '@angular/core';

export type DataKey = string;
export type DataValue = unknown;

@Injectable({
  providedIn: 'root',
})
export class StateStoreState {
  public readonly data = new Map<DataKey, DataValue>();

  public readonly listenedKeys = signal<DataKey[]>([]);
}
