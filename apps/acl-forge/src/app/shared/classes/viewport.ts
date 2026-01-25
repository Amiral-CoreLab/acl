import { singletonUtil } from '../utils';
import { AnimationFrameService } from '../services/animation-frame.service';
import { WindowEventService } from '../services/window-event.service';
import { clamp } from '@amiral-corelab/acl';

const MIN_ZOOM = 10;
const MAX_ZOOM = 10000;
const DEFAULT_ZOOM = 100;
const DEFAULT_COORDINATE = 0;
const EMPTY_SIZE = 0;

export interface ViewportEventByType {
  update: { x: number; y: number; zoomFactor: number };
}
export type ViewportEventKey = keyof ViewportEventByType;
export type ViewportEventListener<T extends ViewportEventKey> = (event: ViewportEventByType[T]) => void;
export type RemoveViewportEventListener = () => void;

export class Viewport {
  readonly #animationFrameService = singletonUtil(AnimationFrameService);
  readonly #windowEventService = singletonUtil(WindowEventService);

  readonly #listenersByType = new Map<ViewportEventKey, Set<ViewportEventListener<ViewportEventKey>>>();
  readonly #dom = document.createElement('div');
  #zoom = DEFAULT_ZOOM;
  #x = DEFAULT_COORDINATE;
  #y = DEFAULT_COORDINATE;
  #wheelEventWaitingFrame: WheelEvent | undefined;

  readonly #initDom = (): void => {
    this.#dom.style.boxSizing = 'border-box';
    this.#dom.style.display = 'block';
    this.#dom.style.width = '100%';
    this.#dom.style.height = '100%';
    this.#dom.style.maxWidth = '100%';
    this.#dom.style.maxHeight = '100%';
    this.#dom.style.overflow = 'hidden';
  };

  public get zoomFactor(): number {
    return this.#zoom / DEFAULT_ZOOM;
  }

  private readonly updateViewBox = (): void => {
    const { firstElementChild } = this.#dom;

    if (!(firstElementChild instanceof HTMLElement || firstElementChild instanceof SVGElement)) {
      return;
    }

    firstElementChild.style.transformOrigin = '0 0';
    firstElementChild.style.transform = `translate(${this.#x}px, ${this.#y}px) scale(${this.zoomFactor})`;

    for (const listener of this.#listenersByType.get('update') ?? []) {
      try {
        listener({ x: this.#x, y: this.#y, zoomFactor: this.zoomFactor });
      } catch {
        // Empty
      }
    }
  };

  readonly #onFrame = (): void => {
    const event = this.#wheelEventWaitingFrame;

    if (!event) {
      return;
    }

    this.#wheelEventWaitingFrame = undefined;

    if (this.#windowEventService.isControlPressed || this.#windowEventService.isMetaPressed) {
      const { x: marginX, y: marginY } = this.#dom.getBoundingClientRect();
      const pointerScreenX = event.clientX - marginX;
      const pointerScreenY = event.clientY - marginY;
      const previousScale = this.zoomFactor;
      const worldX = (pointerScreenX - this.#x) / previousScale;
      const worldY = (pointerScreenY - this.#y) / previousScale;
      this.#zoom = clamp(this.#zoom - event.deltaY * this.zoomFactor, MIN_ZOOM, MAX_ZOOM);
      const nextScale = this.zoomFactor;
      this.#x = pointerScreenX - worldX * nextScale;
      this.#y = pointerScreenY - worldY * nextScale;
    } else {
      this.#x += event.deltaX;
      this.#y += event.deltaY;
    }

    this.updateViewBox();
  };

  readonly #onWheel = (event: WheelEvent): void => {
    if (!this.#windowEventService.isFocused) {
      return;
    }

    this.#wheelEventWaitingFrame = event;
  };

  public constructor() {
    this.#initDom();

    this.#animationFrameService.addFrameListener(this.#onFrame);
    this.#dom.addEventListener('wheel', this.#onWheel);
  }

  public get dom(): HTMLDivElement {
    return this.#dom;
  }

  public get zoom(): number {
    return this.#zoom;
  }

  public get x(): number {
    return this.#x;
  }

  public get y(): number {
    return this.#y;
  }

  public readonly addViewportEventListener = <T extends ViewportEventKey>(
    type: T,
    listener: ViewportEventListener<T>,
  ): RemoveViewportEventListener => {
    let listeners = this.#listenersByType.get(type);

    if (!listeners) {
      listeners = new Set();

      this.#listenersByType.set(type, listeners);
    }

    // @ts-expect-error Argument of type ViewportEventListener<T> is not assignable to
    listeners.add(listener);

    return () => {
      // @ts-expect-error Argument of type ViewportEventListener<T> is not assignable to
      listeners.delete(listener);

      if (listeners.size !== EMPTY_SIZE) {
        return;
      }

      this.#listenersByType.delete(type);
    };
  };
}
