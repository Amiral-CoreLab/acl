import { Point } from './point';

/**
 * FR: Décrit un arc personnalisé attaché à un sommet quand un simple radius ne suffit pas.
 * EN: Describes a custom arc attached to a vertex when a simple radius is not enough.
 */
export interface VertexCustomCornerArc {
  readonly entryX: number;
  readonly entryY: number;
  readonly exitX: number;
  readonly exitY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly axisRotation: number;
  readonly largeArcFlag: number;
  readonly sweepFlag: number;
}

/**
 * FR: Représente un sommet de chemin avec un rayon de coin et un arc personnalisé éventuel.
 * EN: Represents a path vertex with a corner radius and an optional custom arc.
 */
export class Vertex extends Point {
  public readonly customCornerArc: VertexCustomCornerArc | undefined;
  public readonly cornerRadius: number;

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  public constructor(x: number, y: number, cornerRadius = 0, customCornerArc?: VertexCustomCornerArc) {
    super(x, y);

    this.cornerRadius = cornerRadius;
    this.customCornerArc = customCornerArc;
  }
}
