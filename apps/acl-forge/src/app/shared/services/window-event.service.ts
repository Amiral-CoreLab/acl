const EMPTY_SIZE = 0;

export interface WindowEventByKey {
  keydown: KeyboardEvent;
  keyup: KeyboardEvent;
  focus: FocusEvent;
  blur: FocusEvent;
}

export type WindowEventKey = keyof WindowEventByKey;
export type WindowEvent = WindowEventByKey[WindowEventKey];
export type WindowEventListener<T extends WindowEventKey> = (event: WindowEventByKey[T]) => void;
export type RemoveWindowEventListener = () => void;

export const isWindowEventType = (_type: string): _type is WindowEventKey => true;

export class WindowEventService {
  readonly #listenersByKey = new Map<WindowEventKey, Set<WindowEventListener<WindowEventKey>>>();
  #isControlPressed = false;
  #isMetaPressed = false;
  #isFocused = document.hasFocus();

  readonly #eventListener = (event: WindowEvent): void => {
    if (!isWindowEventType(event.type)) {
      return;
    }

    for (const listener of this.#listenersByKey.get(event.type) ?? []) {
      try {
        listener(event);
      } catch {
        // Empty
      }
    }
  };

  public readonly addWindowEventListener = <T extends WindowEventKey>(
    key: T,
    listener: WindowEventListener<T>,
  ): RemoveWindowEventListener => {
    let listeners = this.#listenersByKey.get(key);

    if (!listeners) {
      listeners = new Set();

      window.addEventListener(key, this.#eventListener);

      this.#listenersByKey.set(key, listeners);
    }

    // @ts-expect-error Argument of type WindowEventListener<T> is not assignable to
    listeners.add(listener);

    return () => {
      // @ts-expect-error Argument of type WindowEventListener<T> is not assignable to
      listeners.delete(listener);

      if (listeners.size !== EMPTY_SIZE) {
        return;
      }

      this.#listenersByKey.delete(key);

      window.removeEventListener(key, this.#eventListener);
    };
  };

  readonly #onWindowKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Control') {
      this.#isControlPressed = true;
    }

    if (event.key === 'Meta') {
      this.#isMetaPressed = true;
    }
  };

  readonly #onWindowKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'Control') {
      this.#isControlPressed = false;
    }

    if (event.key === 'Meta') {
      this.#isMetaPressed = false;
    }
  };

  readonly #onWindowFocus = (): void => {
    this.#isFocused = true;
  };

  readonly #onWindowBlur = (): void => {
    this.#isFocused = false;
  };

  public constructor() {
    this.addWindowEventListener('keydown', this.#onWindowKeyDown);
    this.addWindowEventListener('keyup', this.#onWindowKeyUp);
    this.addWindowEventListener('focus', this.#onWindowFocus);
    this.addWindowEventListener('blur', this.#onWindowBlur);
  }

  public get isControlPressed(): boolean {
    return this.#isControlPressed;
  }

  public get isMetaPressed(): boolean {
    return this.#isMetaPressed;
  }

  public get isFocused(): boolean {
    return this.#isFocused;
  }
}
