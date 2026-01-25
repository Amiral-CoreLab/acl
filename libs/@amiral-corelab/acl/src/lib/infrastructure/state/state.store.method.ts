import type { Signal, WritableSignal } from '@angular/core';
import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import type { DataKey, DataValue } from './state.store.state';
import { StateStoreState } from './state.store.state';
import { Exception, ExceptionStore } from '../exception';
import type { Entries, IterableSource } from '@amiral-corelab/acl';

export type DataListener = (patch: ReadonlyMap<DataKey, DataValue>) => void;
export type RemoveDataListener = () => void;

export interface SignalHandle {
  signal: Signal<DataValue>;
  destroy: () => void;
}

const EMPTY_SIZE = 0;

@Injectable({
  providedIn: 'root',
})
export class StateStoreMethod {
  protected readonly state = inject(StateStoreState);

  private readonly exceptionStore = inject(ExceptionStore);
  private readonly signalsByKey = new Map<DataKey, Set<WritableSignal<DataValue>>>();
  private readonly pendingPatchByListener = new Map<DataListener, Map<DataKey, DataValue>>();
  private readonly listenersByKey = new Map<DataKey, Set<DataListener>>();
  private isFlushScheduled = false;

  private readonly scheduleFlush = (): void => {
    if (this.isFlushScheduled) {
      return;
    }

    this.isFlushScheduled = true;

    queueMicrotask(() => {
      for (const [key, signals] of this.signalsByKey) {
        for (const keySignal of signals) {
          keySignal.set(this.state.data.get(key));
        }
      }

      for (const [listener, pendingPatch] of this.pendingPatchByListener) {
        try {
          listener(pendingPatch);
        } catch (e) {
          const cause = Error.isError(e) ? e : undefined;
          const exception = new Exception(
            'Error thrown during StateStore listener execution',
            'technical',
            'STATE_STORE_LISTENER_ERROR',
            cause,
          );
          this.exceptionStore.collect(exception);
        }
      }

      this.pendingPatchByListener.clear();
      this.isFlushScheduled = false;
    });
  };

  public readonly patch = (patch: Entries<DataKey, DataValue>): void => {
    let hasChanges = false;

    for (const [key, value] of patch) {
      if (Object.is(this.state.data.get(key), value)) {
        continue;
      }

      this.state.data.set(key, value);

      for (const listener of this.listenersByKey.get(key) ?? []) {
        let pendingPatch = this.pendingPatchByListener.get(listener);

        if (!pendingPatch) {
          pendingPatch = new Map();

          this.pendingPatchByListener.set(listener, pendingPatch);
        }

        pendingPatch.set(key, value);
      }

      hasChanges = true;
    }

    if (!hasChanges) {
      return;
    }

    this.scheduleFlush();
  };

  private readonly removeListenerFromKey = (key: DataKey, listener: DataListener): void => {
    const listeners = this.listenersByKey.get(key);

    if (!listeners) {
      return;
    }

    listeners.delete(listener);

    if (listeners.size !== EMPTY_SIZE) {
      return;
    }

    this.listenersByKey.delete(key);
  };

  private readonly removeListenerFromRemovedKeys = (
    previousKeys: Set<DataKey>,
    nextKeys: Set<DataKey>,
    listener: DataListener,
  ): void => {
    for (const key of previousKeys.difference(nextKeys)) {
      this.removeListenerFromKey(key, listener);
    }
  };

  private readonly addListenerToNewKeys = (
    previousKeys: Set<DataKey>,
    nextKeys: Set<DataKey>,
    listener: DataListener,
  ): void => {
    for (const key of nextKeys.difference(previousKeys)) {
      let listeners = this.listenersByKey.get(key);

      if (!listeners) {
        listeners = new Set();

        this.listenersByKey.set(key, listeners);
      }

      listeners.add(listener);
    }
  };

  private readonly removeListenerFromAllKeys = (keys: Set<DataKey>, listener: DataListener): void => {
    for (const key of keys) {
      this.removeListenerFromKey(key, listener);
    }
  };

  private readonly updateListenedKeys = (): void => {
    this.state.listenedKeys.set([...this.listenersByKey.keys(), ...this.signalsByKey.keys()]);
  };

  public readonly addDataListener = (
    keysSignal: Signal<IterableSource<DataKey>>,
    listener: DataListener,
  ): RemoveDataListener => {
    let previousKeys = new Set<DataKey>(keysSignal());

    this.addListenerToNewKeys(new Set<DataKey>(), previousKeys, listener);
    this.updateListenedKeys();

    const ref = effect(() => {
      const nextKeys = new Set(keysSignal());

      untracked(() => {
        this.removeListenerFromRemovedKeys(previousKeys, nextKeys, listener);
        this.addListenerToNewKeys(previousKeys, nextKeys, listener);
        this.updateListenedKeys();

        previousKeys = nextKeys;
      });
    });

    return () => {
      this.removeListenerFromAllKeys(previousKeys, listener);
      this.updateListenedKeys();
      previousKeys.clear();
      ref.destroy();
    };
  };

  public readonly createDataSignal = (key: DataKey): SignalHandle => {
    const keySignal = signal(this.state.data.get(key));
    let keySignals = this.signalsByKey.get(key);

    if (!keySignals) {
      keySignals = new Set();

      this.signalsByKey.set(key, keySignals);
    }

    keySignals.add(keySignal);
    this.updateListenedKeys();

    return {
      signal: keySignal.asReadonly(),
      destroy: (): void => {
        keySignals.delete(keySignal);

        if (keySignals.size === EMPTY_SIZE) {
          this.signalsByKey.delete(key);
        }

        this.updateListenedKeys();
      },
    };
  };

  public readonly getValues = (keys: IterableSource<DataKey>): ReadonlyMap<DataKey, DataValue> => {
    const data = new Map<DataKey, DataValue>();

    for (const key of keys) {
      data.set(key, this.state.data.get(key));
    }

    return data;
  };
}
