import { Vector } from './vector';
import { CommandMove } from './command-move';
import { CommandLine } from './command-line';

/**
 * FR: Représente un point 2D de base utilisé dans la géométrie SVG.
 * EN: Represents a basic 2D point used in SVG geometry.
 */
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

  public get moveToCommand(): CommandMove {
    return CommandMove.fromPoint(this);
  }

  public get lineToCommand(): CommandLine {
    return CommandLine.fromPoint(this);
  }

  public get key(): string {
    return `${this.x},${this.y}`;
  }
}
