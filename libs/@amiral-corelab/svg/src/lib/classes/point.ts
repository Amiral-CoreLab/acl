import { Vector } from './vector';

/**
 * FR: Décrit un objet qui possède simplement des coordonnées x et y.
 * EN: Describes an object that only exposes x and y coordinates.
 */
export interface PointLike {
  readonly x: number;
  readonly y: number;
}

/**
 * FR: Représente un point 2D de base utilisé dans la géométrie SVG.
 * EN: Represents a basic 2D point used in SVG geometry.
 */
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
