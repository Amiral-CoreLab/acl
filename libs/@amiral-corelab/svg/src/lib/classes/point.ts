import { Vector } from './vector';

export class Point {
  public static isEqual(a: Point, b: Point): boolean {
    return a.x === b.x && a.y === b.y;
  }

  public readonly x: number;
  public readonly y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public vectorTo(target: Point): Vector {
    return Vector.fromPoints(this, target);
  }

  public get moveToCommand(): string {
    return `M${this.x} ${this.y}`;
  }

  public get lineToCommand(): string {
    return `L${this.x} ${this.y}`;
  }
}
