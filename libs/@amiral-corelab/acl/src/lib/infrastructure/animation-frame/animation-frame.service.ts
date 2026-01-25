import { Injectable } from '@angular/core';

export type FrameListener = (time: DOMHighResTimeStamp) => void;
export type RemoveFrameListener = () => void;

const EMPTY_SIZE = 0;
const ONE_LISTENER = 1;

@Injectable({
  providedIn: 'root',
})
export class AnimationFrameService {
  private readonly frameListeners = new Set<FrameListener>();

  private readonly frameRequestCallback = (time: DOMHighResTimeStamp): void => {
    if (this.frameListeners.size === EMPTY_SIZE) {
      return;
    }

    for (const frameListener of this.frameListeners) {
      frameListener(time);
    }

    requestAnimationFrame(this.frameRequestCallback);
  };

  public readonly addFrameListener = (frameListener: FrameListener): RemoveFrameListener => {
    this.frameListeners.add(frameListener);

    if (this.frameListeners.size === ONE_LISTENER) {
      requestAnimationFrame(this.frameRequestCallback);
    }

    return () => {
      this.frameListeners.delete(frameListener);
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
