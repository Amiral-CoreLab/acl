import type { Segment } from './segment';
import type { Vertex } from './vertex';

export class SegmentPrimitive {
  public readonly geometry: Segment;
  public readonly startVertex: Vertex | undefined;
  public readonly endVertex: Vertex | undefined;

  public constructor(geometry: Segment, startVertex?: Vertex, endVertex?: Vertex) {
    this.geometry = geometry;
    this.startVertex = startVertex;
    this.endVertex = endVertex;
  }
}
