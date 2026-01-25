import { singletonUtil } from '../utils';
import { Viewport } from './viewport';
import { Svg } from './svg';

export class SvgOverlay {
  readonly #viewport = singletonUtil(Viewport);
  readonly #svg = singletonUtil(Svg);

  readonly #dom = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  readonly #svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  readonly #initDom = (): void => {
    this.#dom.style.position = 'absolute';
    this.#dom.style.top = '0';
    this.#dom.style.left = '0';
    this.#dom.style.boxSizing = 'border-box';
    this.#dom.style.display = 'block';
    this.#dom.style.width = '100%';
    this.#dom.style.height = '100%';
    this.#dom.style.maxWidth = '100%';
    this.#dom.style.maxHeight = '100%';
    this.#dom.style.overflow = 'hidden';
    this.#dom.style.pointerEvents = 'none';

    this.#svgPath.style.stroke = '#000';
    this.#svgPath.style.fill = 'none';

    this.#dom.appendChild(this.#svgPath);

    const reobs = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;

      this.#dom.setAttribute('viewBox', `0 0 ${width} ${height}`);
      this.#dom.setAttribute('width', String(width));
      this.#dom.setAttribute('height', String(height));
    });

    reobs.observe(this.#dom);
  };

  private updateOverlayPath(x: number, y: number, zoom: number): void {
    const { width, height } = this.#svg;

    const x0 = Math.round(x);
    const y0 = Math.round(y);

    const x1 = Math.round(x + width * zoom);
    const y1 = Math.round(y + height * zoom);

    const d = `
    M ${x0} ${y0}
    L ${x1} ${y0}
    L ${x1} ${y1}
    L ${x0} ${y1}
    Z
  `;

    this.#svgPath.setAttribute('d', d.trim());
  }

  public constructor() {
    this.#initDom();

    this.#viewport.addViewportEventListener('update', ({ x, y, zoomFactor }) => {
      this.updateOverlayPath(x, y, zoomFactor);
    });
  }

  public get dom(): SVGSVGElement {
    return this.#dom;
  }
}
