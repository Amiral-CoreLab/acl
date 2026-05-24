import type { InitArg } from '@amiral-corelab/core';
import { CornerDefinition } from './corner-definition';
import { Vector } from './vector';

export interface CornerDefinitionBezierInit {
  incomingHandle: Vector;
  outgoingHandle: Vector;
}

export class CornerDefinitionBezier extends CornerDefinition {
  public readonly incomingHandle: Vector;
  public readonly outgoingHandle: Vector;

  public constructor(initArg?: InitArg<CornerDefinitionBezierInit>) {
    super();

    this.incomingHandle = initArg?.incomingHandle ?? new Vector();
    this.outgoingHandle = initArg?.outgoingHandle ?? new Vector();
  }
}
