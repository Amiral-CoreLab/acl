import { assert, getNeighborIndexes, isFirstIndex, isLastIndex, wrapIndex } from '@amiral-corelab/core';
import type { Vertex, VertexCustomCornerArc } from './vertex';
import { CornerArc } from './corner-arc';
import { CornerGeometry } from './corner-geometry';

type PathCornerArc = CornerArc | VertexCustomCornerArc;

export class Path {
  public vertices: Vertex[] = [];
  public isPathClosed = false;

  public constructor(vertices: Vertex[]) {
    this.vertices = vertices;
  }

  private createCornerGeometry(index: number): CornerGeometry | undefined {
    const { vertices } = this;

    if (!this.isPathClosed && (isFirstIndex(index) || isLastIndex(index, vertices.length))) {
      return undefined;
    }

    const { previousIndex, currentIndex, nextIndex } = getNeighborIndexes(index, vertices.length);
    const previousPoint = vertices[previousIndex];
    const currentPoint = vertices[currentIndex];
    const nextPoint = vertices[nextIndex];

    assert(previousPoint !== undefined, 'Previous point is undefined');
    assert(currentPoint !== undefined, 'Current point is undefined');
    assert(nextPoint !== undefined, 'Next point is undefined');

    try {
      return new CornerGeometry(previousPoint, currentPoint, nextPoint);
    } catch {
      return undefined;
    }
  }

  private getEdgeLength(currentIndex: number, nextIndex: number): number | undefined {
    const currentVertex = this.vertices[currentIndex];
    const nextVertex = this.vertices[nextIndex];

    return currentVertex && nextVertex ? currentVertex.vectorTo(nextVertex).length : undefined;
  }

  private getNormalizedCornerTangentOffsets(cornerGeometries: (CornerGeometry | undefined)[]): number[] {
    const { vertices, isPathClosed } = this;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const tangentOffsets = cornerGeometries.map((cornerGeometry) => cornerGeometry?.tangentOffset ?? 0);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const edgeCount = isPathClosed ? vertices.length : vertices.length - 1;

    const normalizedCornerOffsets = tangentOffsets.map((offset) => ({
      incoming: offset,
      outgoing: offset,
    }));

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    for (let index = 0; index < edgeCount; index += 1) {
      const { currentIndex, nextIndex } = getNeighborIndexes(index, vertices.length);
      const currentGeometry = cornerGeometries[currentIndex];
      const nextGeometry = cornerGeometries[nextIndex];
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const currentTangentOffset = currentGeometry?.tangentOffset ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const nextTangentOffset = nextGeometry?.tangentOffset ?? 0;
      const totalOffset = currentTangentOffset + nextTangentOffset;
      const edgeLength = this.getEdgeLength(currentIndex, nextIndex);

      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      if (edgeLength === undefined || edgeLength === 0 || totalOffset <= edgeLength) {
        continue;
      }

      // Keep both corners proportional on the shared edge.
      const scale = edgeLength / totalOffset;

      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      if (currentTangentOffset > 0 && normalizedCornerOffsets[currentIndex]) {
        normalizedCornerOffsets[currentIndex].outgoing = currentTangentOffset * scale;
      }

      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      if (nextTangentOffset > 0 && normalizedCornerOffsets[nextIndex]) {
        normalizedCornerOffsets[nextIndex].incoming = nextTangentOffset * scale;
      }
    }

    return normalizedCornerOffsets.map((offsets) => Math.min(offsets.incoming, offsets.outgoing));
  }

  private createCornerArcs(): (PathCornerArc | undefined)[] {
    const { vertices } = this;
    const cornerGeometries = vertices.map((_, index) => this.createCornerGeometry(index));
    const normalizedTangentOffsets = this.getNormalizedCornerTangentOffsets(cornerGeometries);

    return cornerGeometries.map((geometry, index) => {
      const vertex = vertices[index];
      const tangentOffset = normalizedTangentOffsets[index];

      if (vertex?.customCornerArc) {
        return vertex.customCornerArc;
      }

      if (!vertex || !geometry || tangentOffset === undefined) {
        return undefined;
      }

      return new CornerArc(vertex, geometry, tangentOffset);
    });
  }

  private static getArcMoveToEntryCommand(cornerArc: PathCornerArc): string {
    return `M${cornerArc.entryX} ${cornerArc.entryY}`;
  }

  private static getArcLineToEntryCommand(cornerArc: PathCornerArc): string {
    return `L${cornerArc.entryX} ${cornerArc.entryY}`;
  }

  private static getArcToExitCommand(cornerArc: PathCornerArc): string {
    if (cornerArc instanceof CornerArc) {
      return cornerArc.arcToExitCommand;
    }

    if (cornerArc.segments !== undefined && cornerArc.segments.length > 0) {
      return cornerArc.segments
        .map(
          (segment) =>
            segment.kind === 'line'
              ? `L${segment.endX} ${segment.endY}`
              : `A${segment.radiusX} ${segment.radiusY} ${segment.axisRotation} ${segment.largeArcFlag} ${segment.sweepFlag} ${segment.exitX} ${segment.exitY}`,
        )
        .join(' ');
    }

    return `A${cornerArc.radiusX} ${cornerArc.radiusY} ${cornerArc.axisRotation} ${cornerArc.largeArcFlag} ${cornerArc.sweepFlag} ${cornerArc.exitX} ${cornerArc.exitY}`;
  }

  private getMoveCommand(vertex: Vertex, cornerArc?: PathCornerArc): string {
    if (!this.isPathClosed) {
      return vertex.moveToCommand;
    }

    return cornerArc ? Path.getArcMoveToEntryCommand(cornerArc) : vertex.moveToCommand;
  }

  private isPreviousCornerArcExit(vertex: Vertex, index: number, cornerArcs: (PathCornerArc | undefined)[]): boolean {
    if (isFirstIndex(index)) {
      return false;
    }

    const { previousIndex } = getNeighborIndexes(index, this.vertices.length);
    const previousCornerArc = cornerArcs[previousIndex];

    return previousCornerArc?.exitX === vertex.x && previousCornerArc.exitY === vertex.y;
  }

  private getPathCommands(cornerArcs: (PathCornerArc | undefined)[]): string[] {
    const { vertices, isPathClosed } = this;
    const pathCommands: string[] = [];

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    for (let index = 0; index < vertices.length; index += 1) {
      const vertexIndex = wrapIndex(index, vertices.length);
      const vertex = vertices[vertexIndex];

      if (!vertex) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const isOpenPathLastVertex = index === vertices.length - 1 && !isPathClosed;
      const cornerArc = isOpenPathLastVertex ? undefined : cornerArcs[vertexIndex];

      if (isFirstIndex(index)) {
        pathCommands.push(cornerArc ? Path.getArcMoveToEntryCommand(cornerArc) : vertex.moveToCommand);
      } else if (cornerArc) {
        const previousVertex = vertices[wrapIndex(index - 1, vertices.length)];

        if (
          previousVertex?.x !== cornerArc.entryX ||
          previousVertex.y !== cornerArc.entryY
        ) {
          pathCommands.push(Path.getArcLineToEntryCommand(cornerArc));
        }
      } else if (this.isPreviousCornerArcExit(vertex, index, cornerArcs)) {
        continue;
      } else {
        pathCommands.push(vertex.lineToCommand);
      }

      if (cornerArc) {
        pathCommands.push(Path.getArcToExitCommand(cornerArc));
      }
    }

    if (this.isPathClosed) {
      pathCommands.push('Z');
    }

    return pathCommands;
  }

  public get d(): string {
    const [firstVertex] = this.vertices;

    if (!firstVertex) {
      return '';
    }

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (this.vertices.length === 1) {
      return this.getMoveCommand(firstVertex);
    }

    const cornerArcs = this.createCornerArcs();

    return [...this.getPathCommands(cornerArcs)].join(' ');
  }
}
