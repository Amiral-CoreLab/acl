import type { PointLike } from './point';

export class Vector {
  public static fromPoints(from: PointLike, to: PointLike): Vector {
    return new Vector(to.x - from.x, to.y - from.y);
  }

  public readonly x: number;
  public readonly y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public get length(): number {
    return Math.hypot(this.x, this.y);
  }

  public get normalized(): Vector {
    const { length } = this;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      return new Vector(0, 0);
    }

    return new Vector(this.x / length, this.y / length);
  }
}
