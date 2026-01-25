import type { Shape } from './shape';

interface IterationModel {
  shape: Shape<any>;
  previous: any;
  next: any;
}

export class Iteration {
  private readonly iterations: IterationModel[] = [];

  public readonly add = <T>(shape: Shape<T>, previous: T, next: T): void => {
    this.iterations.push({ shape, previous, next });
  };
}
