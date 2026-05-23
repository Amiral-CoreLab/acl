import type { InitArg } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import { Segment } from './segment';

export class PathPrimitivePair {
  public readonly primitiveA: PathPrimitive;
  public readonly primitiveB: PathPrimitive;

  public constructor(initArg?: InitArg<PathPrimitivePair>) {
    this.primitiveA = initArg?.primitiveA ?? new Segment();
    this.primitiveB = initArg?.primitiveB ?? new Segment();
  }
}
