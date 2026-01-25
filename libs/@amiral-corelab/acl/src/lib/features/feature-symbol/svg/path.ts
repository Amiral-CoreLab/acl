import type { Point, PointModel } from './point';

export interface PathModel {
  points: PointModel[];
}

export class Path {
  private readonly element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  private readonly points = new WeakSet<Point>();

  private readonly applyIteration = ({ points }: Partial<PathModel>): void => {
    if (points !== undefined) {
      this.points += points;
    }
  };

  public constructor(model: PathModel) {
    model;
  }
}
