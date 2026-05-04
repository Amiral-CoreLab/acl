import type { Path, Vertex } from '../classes';
import type { SegmentPrimitive } from '../classes/segment-primitive';
import type { ArcPrimitive } from '../classes/arc-primitive';
import { getPathGeometriesUtil } from './get-path-geometries.util';
import { Segment } from '../classes/segment';
import { Arc } from '../classes/arc';
import { Point } from '../classes/point';
import { SegmentPrimitive as SegmentPrimitiveClass } from '../classes/segment-primitive';
import { ArcPrimitive as ArcPrimitiveClass } from '../classes/arc-primitive';

export type PathPrimitive = SegmentPrimitive | ArcPrimitive;

function getMatchingVertex(point: Point, vertices: Vertex[]): Vertex | undefined {
  return vertices.find((vertex) => Point.isEqual(vertex, point));
}

function isPointOnSegment(point: Point, start: Point, end: Point): boolean {
  const segmentDeltaX = end.x - start.x;
  const segmentDeltaY = end.y - start.y;
  const pointDeltaX = point.x - start.x;
  const pointDeltaY = point.y - start.y;
  const crossProduct = segmentDeltaX * pointDeltaY - segmentDeltaY * pointDeltaX;
  const dotProduct = pointDeltaX * segmentDeltaX + pointDeltaY * segmentDeltaY;
  const segmentLengthSquared = segmentDeltaX ** 2 + segmentDeltaY ** 2;

  return crossProduct === 0 && dotProduct >= 0 && dotProduct <= segmentLengthSquared;
}

function getPreviousVertex(vertices: Vertex[], index: number, isPathClosed: boolean): Vertex | undefined {
  if (index === 0 && !isPathClosed) {
    return undefined;
  }

  return vertices[(index - 1 + vertices.length) % vertices.length];
}

function getNextVertex(vertices: Vertex[], index: number, isPathClosed: boolean): Vertex | undefined {
  if (index === vertices.length - 1 && !isPathClosed) {
    return undefined;
  }

  return vertices[(index + 1) % vertices.length];
}

function isArcFromCustomCornerVertex(arc: Arc, vertex: Vertex): boolean {
  const customCornerArc = vertex.customCornerArc;

  return (
    customCornerArc !== undefined &&
    Point.isEqual(customCornerArc.entry, arc.start) &&
    Point.isEqual(customCornerArc.exit, arc.end)
  );
}

function isArcFromRoundedCornerVertex(arc: Arc, previousVertex: Vertex, vertex: Vertex, nextVertex: Vertex): boolean {
  return isPointOnSegment(arc.start, previousVertex, vertex) && isPointOnSegment(arc.end, vertex, nextVertex);
}

function getArcCornerVertex(arc: Arc, path: Path): Vertex | undefined {
  return path.vertices.find((vertex, index, vertices) => {
    if (isArcFromCustomCornerVertex(arc, vertex)) {
      return true;
    }

    const previousVertex = getPreviousVertex(vertices, index, path.isPathClosed);
    const nextVertex = getNextVertex(vertices, index, path.isPathClosed);

    return (
      previousVertex !== undefined &&
      nextVertex !== undefined &&
      vertex.cornerRadius > 0 &&
      isArcFromRoundedCornerVertex(arc, previousVertex, vertex, nextVertex)
    );
  });
}

export function getPathPrimitivesUtil(path: Path): PathPrimitive[] {
  const geometries = getPathGeometriesUtil(path);
  const { vertices } = path;
  const primitives: PathPrimitive[] = [];

  for (const geometry of geometries) {
    if (geometry instanceof Segment) {
      primitives.push(
        new SegmentPrimitiveClass(
          geometry,
          getMatchingVertex(geometry.start, vertices),
          getMatchingVertex(geometry.end, vertices),
        ),
      );
    }

    if (geometry instanceof Arc) {
      primitives.push(new ArcPrimitiveClass(geometry, getArcCornerVertex(geometry, path)));
    }
  }

  return primitives;
}
