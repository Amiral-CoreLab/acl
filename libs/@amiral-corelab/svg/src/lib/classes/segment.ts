import type { Point } from '@amiral-corelab/svg';

export class Segment {
  public readonly start: Point;
  public readonly end: Point;

  public constructor(start: Point, end: Point) {
    this.start = start;
    this.end = end;
  }
}
