import type { OnDestroy } from '@angular/core';
import { inject, Injectable } from '@angular/core';
import { AnimationFrameService, Exception, ExceptionStore } from '@amiral-corelab/acl';
import { isWindowApiKeyUtil } from './is-window-api-key.util';
import type { WindowEventsKeysType } from './window-events-keys.type';
import type { WindowEventsType } from './window-events.type';

export type RemoveWindowEvent = () => void;

const EMPTY_SIZE = 0;
const EVENT_TYPES = ['wheel', 'pointermove'];

@Injectable({
  providedIn: 'root',
})
export class WindowApiService implements OnDestroy {
  private readonly animationFrameService = inject(AnimationFrameService);
  private readonly exceptionStore = inject(ExceptionStore);
  private readonly listenersByKey = new Map<WindowEventsKeysType, Set<(event: WindowEventsType) => void>>();
  private readonly lastEventByKey = new Map<WindowEventsKeysType, WindowEventsType>();

  protected readonly removeFrameListener = this.animationFrameService.addFrameListener(() => {
    for (const [key, event] of this.lastEventByKey) {
      const listeners = this.listenersByKey.get(key);

      for (const listener of listeners ?? []) {
        listener(event);
      }
    }

    this.lastEventByKey.clear();
  });

  private readonly frameEventListener = (event: WindowEventsType): void => {
    if (!isWindowApiKeyUtil(event.type)) {
      return;
    }

    this.lastEventByKey.set(event.type, event);
  };

  private readonly eventListener = (event: WindowEventsType): void => {
    if (!isWindowApiKeyUtil(event.type)) {
      return;
    }

    for (const listener of this.listenersByKey.get(event.type) ?? []) {
      try {
        listener(event);
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
  };

  public readonly addWindowListener = <T extends WindowEventsKeysType>(
    key: T,
    listener: (event: WindowEventMap[T]) => void,
  ): RemoveWindowEvent => {
    let listeners = this.listenersByKey.get(key);

    if (!listeners) {
      listeners = new Set();

      if (EVENT_TYPES.includes(key)) {
        window.addEventListener(key, this.frameEventListener);
      } else {
        window.addEventListener(key, this.eventListener);
      }

      this.listenersByKey.set(key, listeners);
    }

    // @ts-expect-error: key 'WindowEventMap[T]' is not assignable to key 'WindowEvents'.
    listeners.add(listener);

    return () => {
      // @ts-expect-error: key 'WindowEventMap[T]' is not assignable to key 'WindowEvents'.
      listeners.delete(listener);

      if (listeners.size !== EMPTY_SIZE) {
        return;
      }

      this.listenersByKey.delete(key);

      if (EVENT_TYPES.includes(key)) {
        window.removeEventListener(key, this.frameEventListener);
      } else {
        window.removeEventListener(key, this.eventListener);
      }
    };
  };

  public ngOnDestroy(): void {
    this.removeFrameListener();
  }
}
