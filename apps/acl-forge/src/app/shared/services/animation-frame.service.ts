const EMPTY_SIZE = 0;
const ONE_LISTENER = 1;

export type AnimationFrameListener = (time: DOMHighResTimeStamp) => void;
export type RemoveAnimationFrameListener = () => void;

export class AnimationFrameService {
  readonly #frameListeners = new Set<AnimationFrameListener>();

  readonly #frameRequestCallback = (time: DOMHighResTimeStamp): void => {
    if (this.#frameListeners.size === EMPTY_SIZE) {
      return;
    }

    for (const frameListener of this.#frameListeners) {
      frameListener(time);
    }

    requestAnimationFrame(this.#frameRequestCallback);
  };

  public readonly addFrameListener = (frameListener: AnimationFrameListener): RemoveAnimationFrameListener => {
    this.#frameListeners.add(frameListener);

    if (this.#frameListeners.size === ONE_LISTENER) {
      requestAnimationFrame(this.#frameRequestCallback);
    }

    return () => {
      this.#frameListeners.delete(frameListener);
    };
  };

  public get nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      const removeListener = this.addFrameListener(() => {
        removeListener();
        resolve();
      });
    });
  }
}
