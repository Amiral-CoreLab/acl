import { Vector } from './vector';

export interface PointLike {
  readonly x: number;
  readonly y: number;
}

export class Point implements PointLike {
  public static isEqual(a: PointLike, b: PointLike): boolean {
    return a.x === b.x && a.y === b.y;
  }

  public readonly x: number;
  public readonly y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public vectorTo(target: PointLike): Vector {
    return Vector.fromPoints(this, target);
  }

  public get moveToCommand(): string {
    return `M${this.x} ${this.y}`;
  }

  public get lineToCommand(): string {
    return `L${this.x} ${this.y}`;
  }
}
