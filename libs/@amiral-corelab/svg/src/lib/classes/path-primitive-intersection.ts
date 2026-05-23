import type { InitArg } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import { Point } from './point';
import { Segment } from './segment';

export class PathPrimitiveIntersection {
  public readonly point: Point;
  public readonly primitiveA: PathPrimitive;
  public readonly primitiveB: PathPrimitive;
  public readonly parameterA: number;
  public readonly parameterB: number;

  public constructor(initArg?: InitArg<PathPrimitiveIntersection>) {
    this.point = initArg?.point ?? new Point();
    this.primitiveA = initArg?.primitiveA ?? new Segment();
    this.primitiveB = initArg?.primitiveB ?? new Segment();
    this.parameterA = initArg?.parameterA ?? 0;
    this.parameterB = initArg?.parameterB ?? 0;
  }
}
