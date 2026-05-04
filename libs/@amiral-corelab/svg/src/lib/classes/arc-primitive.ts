import type { Vertex } from './vertex';
import type { Arc } from '@amiral-corelab/svg';

export class ArcPrimitive {
  public readonly geometry: Arc;
  public readonly cornerVertex: Vertex | undefined;

  public constructor(geometry: Arc, cornerVertex?: Vertex) {
    this.geometry = geometry;
    this.cornerVertex = cornerVertex;
  }
}
