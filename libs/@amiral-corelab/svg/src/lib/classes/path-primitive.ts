import type { Point } from './point';

export abstract class PathPrimitive {
  public abstract readonly start: Point;
  public abstract readonly end: Point;
}
