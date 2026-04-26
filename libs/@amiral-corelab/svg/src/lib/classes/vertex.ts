import { Point } from './point';

export interface VertexCustomCornerArcSegment {
  readonly exitX: number;
  readonly exitY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly axisRotation: number;
  readonly largeArcFlag: number;
  readonly sweepFlag: number;
}

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
  readonly segments?: readonly VertexCustomCornerArcSegment[];
}

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
