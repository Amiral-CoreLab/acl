import { Point } from './point';

/**
 * FR: Représente un point de découpe situé sur un segment avec son paramètre t.
 * EN: Represents a split point located on a segment with its t parameter.
 */
export class SegmentSplitPoint {
  public readonly point: Point;
  public readonly t: number;

  public constructor(point: Point, t: number) {
    this.point = point;
    this.t = t;
  }
}
