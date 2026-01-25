import { singleton } from './singleton';
import { Iteration } from './iteration';

export abstract class Shape<T> {
  private readonly iteration = singleton(Iteration);

  public abstract updateHandler(context: Partial<T>): void;

  public abstract toObject(): T;

  public readonly update = (context: Partial<T>): void => {
    const previous = this.toObject();

    this.updateHandler(context);

    const next = this.toObject();

    this.iteration.add(this, previous, next);
  };
}
