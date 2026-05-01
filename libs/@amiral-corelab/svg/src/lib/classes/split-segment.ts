import { Point } from './point';

/**
 * FR: Représente un morceau de primitive entre deux points après découpe.
 * EN: Represents a piece of a primitive between two points after splitting.
 */
export class SplitSegment {
  public readonly start: Point;
  public readonly end: Point;
  public readonly primitiveIndex: number;
  public readonly tStart: number;
  public readonly tEnd: number;

  public constructor(start: Point, end: Point, primitiveIndex: number, tStart: number, tEnd: number) {
    this.start = start;
    this.end = end;
    this.primitiveIndex = primitiveIndex;
    this.tStart = tStart;
    this.tEnd = tEnd;
  }

  public pointAt(t: number): Point {
    return new Point(this.start.x + (this.end.x - this.start.x) * t, this.start.y + (this.end.y - this.start.y) * t);
  }

  public getParameter(point: Point): number {
    const directionX = this.end.x - this.start.x;
    const directionY = this.end.y - this.start.y;
    const pointDirectionX = point.x - this.start.x;
    const pointDirectionY = point.y - this.start.y;
    const lengthSquared = directionX ** 2 + directionY ** 2;

    return lengthSquared === 0 ? 0 : (pointDirectionX * directionX + pointDirectionY * directionY) / lengthSquared;
  }
}
