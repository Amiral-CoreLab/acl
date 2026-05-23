import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import {
  CornerDefinitionArcCenter,
  PathPrimitiveArrangement,
  PathPrimitiveFace,
  PathPrimitiveGraphEdge,
  PathPrimitiveGraphNode,
  PathPrimitiveWithOrigin,
  Point,
  Segment,
} from '../classes';
import type { PathPrimitiveIntersectionInput } from './path-primitive-intersection.service';
import { PathPrimitiveCommandService } from './path-primitive-command.service';
import { PathPrimitiveSplitService } from './path-primitive-split.service';

type TraversalEdge = {
  edge: PathPrimitiveGraphEdge;
  twinId: number;
  angle: number;
};

/**
 * Builds a split primitive arrangement graph and extracts closed interior faces.
 */
@Singleton()
export class PathPrimitiveArrangementService {
  private readonly epsilon = 1e-9;
  private readonly areaEpsilon = 1e-8;
  private readonly arcAreaSamples = 24;
  private readonly pathPrimitiveSplitService = getSingleton(PathPrimitiveSplitService);
  private readonly pathPrimitiveCommandService = getSingleton(PathPrimitiveCommandService);

  private isNearlySamePoint(pointA: Point, pointB: Point): boolean {
    return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) <= this.epsilon;
  }

  private getOrCreateNode(nodes: PathPrimitiveGraphNode[], point: Point): PathPrimitiveGraphNode {
    const existingNode = nodes.find((node) => this.isNearlySamePoint(node.point, point));

    if (existingNode) {
      return existingNode;
    }

    const node = new PathPrimitiveGraphNode({ id: nodes.length, point });
    nodes.push(node);

    return node;
  }

  private reversePrimitive(primitive: PathPrimitive): PathPrimitive {
    if (primitive instanceof Segment) {
      return new Segment({ start: primitive.end, end: primitive.start });
    }

    return new CornerDefinitionArcCenter({
      center: primitive.center,
      radiusX: primitive.radiusX,
      radiusY: primitive.radiusY,
      axisRotation: primitive.axisRotation,
      startAngle: primitive.startAngle + primitive.deltaAngle,
      deltaAngle: -primitive.deltaAngle,
    });
  }

  private getEdgeAngle(edge: PathPrimitiveGraphEdge): number {
    const start = this.pathPrimitiveCommandService.getStartPoint(edge.primitive);
    const end = this.pathPrimitiveCommandService.getEndPoint(edge.primitive);

    return Math.atan2(end.y - start.y, end.x - start.x);
  }

  private buildEdges(primitives: PathPrimitiveWithOrigin[], nodes: PathPrimitiveGraphNode[]): PathPrimitiveGraphEdge[] {
    const edges: PathPrimitiveGraphEdge[] = [];

    for (const item of primitives) {
      const start = this.pathPrimitiveCommandService.getStartPoint(item.primitive);
      const end = this.pathPrimitiveCommandService.getEndPoint(item.primitive);

      if (this.isNearlySamePoint(start, end)) {
        continue;
      }

      const from = this.getOrCreateNode(nodes, start);
      const to = this.getOrCreateNode(nodes, end);
      const forward = new PathPrimitiveGraphEdge({
        id: edges.length,
        from,
        to,
        primitive: item.primitive,
        origin: item.origin,
        reverse: false,
      });
      const reverse = new PathPrimitiveGraphEdge({
        id: edges.length + 1,
        from: to,
        to: from,
        primitive: this.reversePrimitive(item.primitive),
        origin: item.origin,
        reverse: true,
      });

      edges.push(forward, reverse);
    }

    return edges;
  }

  private getOutgoingEdges(edges: PathPrimitiveGraphEdge[]): Map<number, TraversalEdge[]> {
    const outgoingEdges = new Map<number, TraversalEdge[]>();

    for (let index = 0; index < edges.length; index += 2) {
      const forward = edges[index];
      const reverse = edges[index + 1];

      if (!forward || !reverse) {
        continue;
      }

      const forwardTraversal: TraversalEdge = {
        edge: forward,
        twinId: reverse.id,
        angle: this.getEdgeAngle(forward),
      };
      const reverseTraversal: TraversalEdge = {
        edge: reverse,
        twinId: forward.id,
        angle: this.getEdgeAngle(reverse),
      };

      outgoingEdges.set(forward.from.id, [...(outgoingEdges.get(forward.from.id) ?? []), forwardTraversal]);
      outgoingEdges.set(reverse.from.id, [...(outgoingEdges.get(reverse.from.id) ?? []), reverseTraversal]);
    }

    for (const [nodeId, nodeEdges] of outgoingEdges) {
      outgoingEdges.set(
        nodeId,
        [...nodeEdges].sort((edgeA, edgeB) => edgeA.angle - edgeB.angle || edgeA.edge.id - edgeB.edge.id),
      );
    }

    return outgoingEdges;
  }

  private getNextTraversalEdge(
    traversalEdge: TraversalEdge,
    outgoingEdges: Map<number, TraversalEdge[]>,
  ): TraversalEdge | undefined {
    const candidates = outgoingEdges.get(traversalEdge.edge.to.id) ?? [];
    const twinIndex = candidates.findIndex((candidate) => candidate.edge.id === traversalEdge.twinId);

    if (twinIndex < 0 || candidates.length === 0) {
      return undefined;
    }

    return candidates[(twinIndex - 1 + candidates.length) % candidates.length];
  }

  private getSegmentAreaContribution(segment: Segment): number {
    return (segment.start.x * segment.end.y - segment.end.x * segment.start.y) / 2;
  }

  private getPrimitiveAreaContribution(primitive: PathPrimitive): number {
    if (primitive instanceof Segment) {
      return this.getSegmentAreaContribution(primitive);
    }

    let area = 0;
    let previousPoint = primitive.getStart();

    for (let index = 1; index <= this.arcAreaSamples; index += 1) {
      const parameter = index / this.arcAreaSamples;
      const point = primitive.getPointAtAngle(primitive.startAngle + primitive.deltaAngle * parameter);
      area += this.getSegmentAreaContribution(new Segment({ start: previousPoint, end: point }));
      previousPoint = point;
    }

    return area;
  }

  private getFaceSignedArea(edges: PathPrimitiveGraphEdge[]): number {
    return edges.reduce((area, edge) => area + this.getPrimitiveAreaContribution(edge.primitive), 0);
  }

  private createFace(edges: PathPrimitiveGraphEdge[]): PathPrimitiveFace {
    const signedArea = this.getFaceSignedArea(edges);

    return new PathPrimitiveFace({
      edges,
      primitives: edges.map((edge) => edge.primitive),
      points: edges.map((edge) => edge.from.point),
      signedArea,
      area: Math.abs(signedArea),
    });
  }

  private extractClosedFaces(edges: PathPrimitiveGraphEdge[]): PathPrimitiveFace[] {
    const outgoingEdges = this.getOutgoingEdges(edges);
    const traversalEdges = [...outgoingEdges.values()].flat();
    const visitedEdgeIds = new Set<number>();
    const faces: PathPrimitiveFace[] = [];

    for (const startEdge of traversalEdges) {
      if (visitedEdgeIds.has(startEdge.edge.id)) {
        continue;
      }

      const faceEdges: PathPrimitiveGraphEdge[] = [];
      let currentEdge: TraversalEdge | undefined = startEdge;

      while (currentEdge && !visitedEdgeIds.has(currentEdge.edge.id)) {
        visitedEdgeIds.add(currentEdge.edge.id);
        faceEdges.push(currentEdge.edge);
        currentEdge = this.getNextTraversalEdge(currentEdge, outgoingEdges);
      }

      if (!currentEdge || currentEdge.edge.id !== startEdge.edge.id || faceEdges.length < 2) {
        continue;
      }

      const face = this.createFace(faceEdges);

      if (face.signedArea > this.areaEpsilon) {
        faces.push(face);
      }
    }

    return faces;
  }

  /**
   * Builds a split arrangement graph and extracts closed faces.
   *
   * @param inputs Primitives or primitive wrappers to arrange.
   *
   * @returns Arrangement with split primitives, nodes, directed edges, and interior faces.
   */
  public getArrangement(inputs: PathPrimitiveIntersectionInput[]): PathPrimitiveArrangement {
    const primitives = this.pathPrimitiveSplitService.splitPrimitives(inputs);
    const nodes: PathPrimitiveGraphNode[] = [];
    const edges = this.buildEdges(primitives, nodes);
    const faces = this.extractClosedFaces(edges);

    return new PathPrimitiveArrangement({ primitives, nodes, edges, faces });
  }

  /**
   * Extracts closed interior faces from primitives.
   *
   * @param inputs Primitives or primitive wrappers to arrange.
   *
   * @returns Closed interior faces.
   */
  public getClosedFaces(inputs: PathPrimitiveIntersectionInput[]): PathPrimitiveFace[] {
    return this.getArrangement(inputs).faces;
  }
}
