import type { Point } from '@amiral-corelab/svg';

export class DirectEdge {
  public from: Point;
  public to: Point;

  public constructor(from: Point, to: Point) {
    this.from = from;
    this.to = to;
  }

  public get key(): string {
    return `${this.from.key}->${this.to.key}`;
  }
}
