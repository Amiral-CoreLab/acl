import { SweepFlagEnum } from '../enums';
import type { Vertex } from './vertex';
import type { Vector } from './vector';

export class CornerGeometry {
  public readonly previousVertex: Vertex;
  public readonly cornerVertex: Vertex;
  public readonly nextVertex: Vertex;

  public readonly incomingVector: Vector;
  public readonly outgoingVector: Vector;

  public readonly incomingUnitVector: Vector;
  public readonly outgoingUnitVector: Vector;

  public readonly tangentFactor: number;
  public readonly tangentOffset: number;

  public readonly sweepFlag: SweepFlagEnum;

  public constructor(previousVertex: Vertex, cornerVertex: Vertex, nextVertex: Vertex) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (cornerVertex.cornerRadius <= 0) {
      throw new Error('Corner radius must be greater than zero.');
    }

    this.previousVertex = previousVertex;
    this.cornerVertex = cornerVertex;
    this.nextVertex = nextVertex;

    this.incomingVector = cornerVertex.vectorTo(previousVertex);
    this.outgoingVector = cornerVertex.vectorTo(nextVertex);

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (this.incomingVector.length === 0 || this.outgoingVector.length === 0) {
      throw new Error('Incoming and outgoing edges must not be zero.');
    }

    this.incomingUnitVector = this.incomingVector.normalized;
    this.outgoingUnitVector = this.outgoingVector.normalized;

    const dotProduct =
      this.incomingUnitVector.x * this.outgoingUnitVector.x + this.incomingUnitVector.y * this.outgoingUnitVector.y;
    const angle = Math.acos(dotProduct);

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (angle === 0 || angle === Math.PI) {
      throw new Error('Incoming and outgoing edges must not be parallel.');
    }

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    this.tangentFactor = Math.tan(angle / 2);
    this.tangentOffset = this.cornerVertex.cornerRadius / this.tangentFactor;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (this.tangentOffset === 0 || !Number.isFinite(this.tangentOffset) || !Number.isFinite(this.tangentFactor)) {
      throw new Error('Corner angle does not allow a valid tangent offset.');
    }

    const crossProduct =
      this.incomingUnitVector.x * this.outgoingUnitVector.y - this.incomingUnitVector.y * this.outgoingUnitVector.x;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    this.sweepFlag = crossProduct >= 0 ? SweepFlagEnum.Clockwise : SweepFlagEnum.Counterclockwise;
  }
}
