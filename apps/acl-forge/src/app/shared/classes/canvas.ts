import { singletonUtil } from '../utils';
import { Svg } from './svg';
import { SvgOverlay } from './svg-overlay';
import { Viewport } from './viewport';

export class Canvas {
  readonly #svg = singletonUtil(Svg);
  readonly #svgOverlay = singletonUtil(SvgOverlay);
  readonly #viewport = singletonUtil(Viewport);

  readonly #dom = document.createElement('div');

  readonly #initDom = (): void => {
    this.#dom.style.position = 'relative';
    this.#dom.style.boxSizing = 'border-box';
    this.#dom.style.display = 'block';
    this.#dom.style.width = '100%';
    this.#dom.style.height = '100%';
    this.#dom.style.maxWidth = '100%';
    this.#dom.style.maxHeight = '100%';
    this.#dom.style.overflow = 'hidden';

    this.#svg.width = 100;
    this.#svg.height = 100;
    this.#viewport.dom.appendChild(this.#svg.dom);
    this.#dom.appendChild(this.#viewport.dom);
    this.#dom.appendChild(this.#svgOverlay.dom);
  };

  public constructor() {
    this.#initDom();
  }

  public get dom(): HTMLDivElement {
    return this.#dom;
  }
}
