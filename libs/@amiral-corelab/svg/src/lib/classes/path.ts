import type { InitArg } from '@amiral-corelab/core';
import { getNeighborIndexes, getSingleton, isFirstIndex, isLastIndex } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import type { Vertex } from './vertex';
import type { PathCommand } from './path-command';
import { CornerVertices } from './corner-vertices';
import { CornerDefinitionRadiusGeometry } from './corner-definition-radius-geometry';
import { Segment } from './segment';
import { PathCommandClose } from './path-command-close';
import { PathCommandMove } from './path-command-move';
import { PathPrimitiveCommandService } from '../services';

/**
 * Represents a logical SVG path model built from ordered vertices.
 *
 * The path stores authoring data, not final SVG path data. Vertices can be resolved into
 * drawable primitives, then converted to SVG path commands.
 *
 * @see https://www.w3.org/TR/SVG2/paths.html
 */
export class Path {
  /**
   * Ordered vertices defining the logical path outline.
   */
  public readonly vertices: Vertex[] = [];

  /**
   * Whether the path has a closing edge from the last vertex back to the first vertex.
   */
  public readonly closed: boolean;

  /**
   * Creates a path from optional vertices and closed state.
   *
   * @param initArg Source path values.
   */
  public constructor(initArg?: InitArg<Path>) {
    this.vertices = initArg?.vertices ?? [];
    this.closed = initArg?.closed ?? false;
  }

  private readonly pathPrimitiveCommandService = getSingleton(PathPrimitiveCommandService);

  /**
   * Gets the neighboring vertices around a vertex index.
   *
   * Open path endpoints do not have a complete corner context, so the missing neighbor is
   * returned as `undefined`. Closed paths wrap around the first and last vertices.
   *
   * @param index Vertex index to inspect.
   *
   * @returns Previous, current, and next vertices when available.
   */
  private getNeighborVertices(index: number): {
    previousVertex: Vertex | undefined;
    currentVertex: Vertex | undefined;
    nextVertex: Vertex | undefined;
  } {
    const { vertices } = this;
    const { previousIndex, currentIndex, nextIndex } = getNeighborIndexes(index, vertices.length);

    if (!this.closed) {
      if (isFirstIndex(index)) {
        return {
          previousVertex: undefined,
          currentVertex: vertices[currentIndex],
          nextVertex: vertices[nextIndex],
        };
      }

      if (isLastIndex(index, vertices.length)) {
        return {
          previousVertex: vertices[previousIndex],
          currentVertex: vertices[currentIndex],
          nextVertex: undefined,
        };
      }
    }

    return {
      previousVertex: vertices[previousIndex],
      currentVertex: vertices[currentIndex],
      nextVertex: vertices[nextIndex],
    };
  }

  /**
   * Builds corner vertex contexts for every path vertex that has two neighbors.
   *
   * Open path endpoints do not produce a context because they do not have both an incoming
   * and outgoing path edge.
   *
   * @returns One corner context per vertex when available.
   */
  private getCornersVertices(): (CornerVertices | undefined)[] {
    return this.vertices.map<CornerVertices | undefined>((_, index) => {
      const { previousVertex, currentVertex, nextVertex } = this.getNeighborVertices(index);

      if (!previousVertex || !currentVertex || !nextVertex) {
        return undefined;
      }

      return new CornerVertices({ previous: previousVertex, current: currentVertex, next: nextVertex });
    });
  }

  /**
   * Resolves radius-based corner geometries for every path vertex.
   *
   * Vertices without a radius corner definition, or with geometry that cannot be resolved,
   * are represented as `undefined`.
   *
   * @returns One optional radius corner geometry per vertex.
   */
  private getCornerGeometries(): (CornerDefinitionRadiusGeometry | undefined)[] {
    return this.getCornersVertices().map<CornerDefinitionRadiusGeometry | undefined>((cornerVertices) => {
      if (!cornerVertices) {
        return undefined;
      }

      try {
        return CornerDefinitionRadiusGeometry.fromCornerVertices(cornerVertices);
      } catch {
        return undefined;
      }
    });
  }

  /**
   * Computes the straight-edge length between two path vertices.
   *
   * This measures the logical path edge, not the fitted segment that may remain after rounded
   * corners consume part of the edge.
   *
   * @param fromIndex Source vertex index.
   * @param toIndex Target vertex index.
   *
   * @returns Edge length, or `undefined` when either vertex is missing.
   */
  private getPathEdgeLength(fromIndex: number, toIndex: number): number | undefined {
    const fromVertex = this.vertices[fromIndex];
    const toVertex = this.vertices[toIndex];

    return fromVertex?.getVectorTo(toVertex).getLength();
  }

  /**
   * Fits radius corner geometries so adjacent rounded corners fit on each path edge.
   *
   * SVG paths are made of segments between current points. When two neighboring radius corners
   * consume more than the available straight-edge length, their tangent offsets are scaled
   * proportionally and their entry/exit tangent points are rebuilt from that fitted offset.
   *
   * @returns One fitted radius corner geometry per vertex, or `undefined` where no radius
   * geometry is available.
   *
   * @see https://www.w3.org/TR/SVG2/paths.html#PathDataGeneralInformation
   */
  private getFittedCornerGeometries(): (CornerDefinitionRadiusGeometry | undefined)[] {
    const cornerGeometries = this.getCornerGeometries();
    const { vertices, closed } = this;
    const tangentOffsets = cornerGeometries.map((cornerGeometry) => cornerGeometry?.tangentOffset ?? 0);
    const fittedTangentOffsets = tangentOffsets.map((tangentOffset) => ({
      incoming: tangentOffset,
      outgoing: tangentOffset,
    }));
    const edgeCount = closed ? vertices.length : vertices.length - 1;

    for (let index = 0; index < edgeCount; index += 1) {
      const { currentIndex, nextIndex } = getNeighborIndexes(index, vertices.length);
      const currentOutgoingTangentOffset = cornerGeometries[currentIndex]?.tangentOffset ?? 0;
      const nextIncomingTangentOffset = cornerGeometries[nextIndex]?.tangentOffset ?? 0;
      const totalTangentOffset = currentOutgoingTangentOffset + nextIncomingTangentOffset;
      const pathEdgeLength = this.getPathEdgeLength(currentIndex, nextIndex);

      if (pathEdgeLength === undefined || pathEdgeLength === 0 || totalTangentOffset <= pathEdgeLength) {
        continue;
      }

      // Two radius corners consume more than the straight edge can provide.
      // Keep their proportions but reduce both tangent offsets so their tangent points still lie on the same SVG path segment.
      const tangentOffsetScale = pathEdgeLength / totalTangentOffset;

      if (currentOutgoingTangentOffset > 0 && fittedTangentOffsets[currentIndex]) {
        fittedTangentOffsets[currentIndex].outgoing = currentOutgoingTangentOffset * tangentOffsetScale;
      }

      if (nextIncomingTangentOffset > 0 && fittedTangentOffsets[nextIndex]) {
        fittedTangentOffsets[nextIndex].incoming = nextIncomingTangentOffset * tangentOffsetScale;
      }
    }

    return cornerGeometries.map<CornerDefinitionRadiusGeometry | undefined>((cornerGeometry, index) => {
      const fittedTangentOffset = fittedTangentOffsets[index];

      if (!cornerGeometry || fittedTangentOffset === undefined) {
        return undefined;
      }

      return cornerGeometry.withTangentOffset(Math.min(fittedTangentOffset.incoming, fittedTangentOffset.outgoing));
    });
  }

  /**
   * Builds drawable path primitives from fitted corner geometries.
   *
   * Each logical path edge becomes a straight segment between the current corner exit and
   * the next corner entry. When the next vertex has a fitted radius corner, its centered arc
   * is appended after that segment.
   *
   * @returns Path primitives in drawing order.
   */
  private getPrimitives(): PathPrimitive[] {
    const { vertices, closed } = this;
    const fittedCornerGeometries = this.getFittedCornerGeometries();
    const edgeCount = closed ? vertices.length : vertices.length - 1;
    const primitives: PathPrimitive[] = [];

    for (let index = 0; index < edgeCount; index += 1) {
      const { currentIndex, nextIndex } = getNeighborIndexes(index, vertices.length);
      const currentVertex = vertices[currentIndex];
      const nextVertex = vertices[nextIndex];

      if (!currentVertex || !nextVertex) {
        continue;
      }

      const currentCornerGeometry = fittedCornerGeometries[currentIndex];
      const nextCornerGeometry = fittedCornerGeometries[nextIndex];
      const segmentStart = currentCornerGeometry?.exit ?? currentVertex;
      const segmentEnd = nextCornerGeometry?.entry ?? nextVertex;

      if (segmentStart.getVectorTo(segmentEnd).getLength() > 0) {
        primitives.push(new Segment({ start: segmentStart, end: segmentEnd }));
      }

      if (nextCornerGeometry) {
        primitives.push(nextCornerGeometry.toArcCenter());
      }
    }

    return primitives;
  }

  /**
   * Converts the logical path model into drawable geometry primitives.
   *
   * @returns Path primitives resolved from vertices and corner definitions.
   */
  public toPrimitives(): PathPrimitive[] {
    return this.getPrimitives();
  }

  /**
   * Converts the logical path model into SVG path commands.
   *
   * @returns SVG path commands.
   */
  public toCommands(): PathCommand[] {
    const primitives = this.toPrimitives();
    const [firstPrimitive] = primitives;

    if (!firstPrimitive) {
      return [];
    }

    const commands: PathCommand[] = [
      new PathCommandMove({ point: this.pathPrimitiveCommandService.getStartPoint(firstPrimitive) }),
      ...primitives.map((primitive) => this.pathPrimitiveCommandService.toCommand(primitive)),
    ];

    if (this.closed) {
      commands.push(new PathCommandClose());
    }

    return commands;
  }
}
