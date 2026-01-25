interface SvgModel {
  width: number;
  height: number;
}

const DEFAULT_NUMBER = 0;

export class Svg {
  private readonly element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  private width = DEFAULT_NUMBER;
  private height = DEFAULT_NUMBER;

  private get viewBox(): string {
    return `0 0 ${this.width} ${this.height}`;
  }

  private applyViewBox(): void {
    this.element.setAttribute('viewBox', this.viewBox);
    this.element.setAttribute('width', `${this.width}`);
    this.element.setAttribute('height', `${this.height}`);
  }

  private readonly applyIteration = (changes: SvgModel): void => {
    const { width, height } = changes;

    this.width += width;
    this.height += height;

    if (width !== DEFAULT_NUMBER || height !== DEFAULT_NUMBER) {
      this.applyViewBox();
    }
  };

  public constructor(iteration: SvgModel) {
    this.applyIteration(iteration);
  }

  public readonly setViewBox = (width: number, height: number): void => {
    const iteration: SvgModel = {
      width: width - this.width,
      height: height - this.height,
    };

    this.applyIteration(iteration);
  };
}
