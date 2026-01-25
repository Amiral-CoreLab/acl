import { Shape } from './shape';

export interface CoordinateModel {
  x: number;
  y: number;
}

export interface PointModel extends CoordinateModel {
  radius: number;
}

const DEFAULT_NUMBER = 0;

export class Point extends Shape<PointModel> {
  private x: PointModel['x'] = DEFAULT_NUMBER;
  private y: PointModel['y'] = DEFAULT_NUMBER;
  private radius: PointModel['radius'] = DEFAULT_NUMBER;

  public readonly updateHandler = ({ x, y, radius }: Partial<PointModel>): void => {
    if (x !== undefined) {
      this.x = x;
    }

    if (y !== undefined) {
      this.y = y;
    }

    if (radius !== undefined) {
      this.radius = radius;
    }
  };

  public readonly toObject = (): PointModel => ({ x: this.x, y: this.y, radius: this.radius });

  public constructor(model: PointModel) {
    super();

    this.updateHandler(model);
  }
}
