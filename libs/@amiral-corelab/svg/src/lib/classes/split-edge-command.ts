/**
 * FR: Représente une arête orientée du graphe de split reliée à une primitive source.
 * EN: Represents a directed edge in the split graph linked to a source primitive.
 */
export class SplitEdgeCommand {
  public readonly fromKey: string;
  public readonly toKey: string;
  public readonly primitiveIndex: number;
  public readonly tStart: number;
  public readonly tEnd: number;

  public constructor(fromKey: string, toKey: string, primitiveIndex: number, tStart: number, tEnd: number) {
    this.fromKey = fromKey;
    this.toKey = toKey;
    this.primitiveIndex = primitiveIndex;
    this.tStart = tStart;
    this.tEnd = tEnd;
  }

  public reversed(): SplitEdgeCommand {
    return new SplitEdgeCommand(this.toKey, this.fromKey, this.primitiveIndex, this.tEnd, this.tStart);
  }
}
