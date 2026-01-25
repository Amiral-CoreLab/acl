const INIT_SIZE = 0;

export class Svg {
  readonly #dom = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  #width = INIT_SIZE;
  #height = INIT_SIZE;

  readonly #initDom = (): void => {
    this.#dom.style.display = 'block';
    this.#dom.style.backgroundColor = 'red';
  };

  readonly #onClick = (event: PointerEvent): void => {
    const ctm = this.#dom.getScreenCTM();

    if (!ctm) {
      return;
    }

    const point = new DOMPoint(event.clientX, event.clientY);

    console.log(point.matrixTransform(ctm.inverse()));
  };

  public constructor() {
    this.#initDom();

    this.#dom.addEventListener('click', this.#onClick);
  }

  readonly #updateDom = (): void => {
    this.#dom.setAttribute('width', `${this.#width}`);
    this.#dom.setAttribute('height', `${this.#height}`);
    this.#dom.setAttribute('viewBox', `0 0 ${this.#width} ${this.#height}`);
  };

  public get dom(): SVGSVGElement {
    return this.#dom;
  }

  public get width(): number {
    return this.#width;
  }

  public set width(value: number) {
    this.#width = value;
    this.#updateDom();
  }

  public get height(): number {
    return this.#height;
  }

  public set height(value: number) {
    this.#height = value;
    this.#updateDom();
  }
}
