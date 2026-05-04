/* eslint-disable max-lines */
import { Path } from '../classes/path';
import { Vertex } from '../classes/vertex';
import { CornerGeometry } from '../classes/corner-geometry';
import { Point } from '../classes/point';
import { SegmentSplitPoint } from '../classes/segment-split-point';
import { SplitEdgeCommand } from '../classes/split-edge-command';
import { SplitGraphNode } from '../classes/split-graph-node';
import { SplitSegment } from '../classes/split-segment';
import type { SvgArcEndpointParameters } from '../classes/svg-arc-endpoint-parameters';
import { Vector } from '../classes/vector';
import { DirectEdge } from '../classes/direct-edge';
import { CommandMove } from '../classes/command-move';
import { CommandLine } from '../classes/command-line';
import { CommandArc } from '../classes/command-arc';
import { CommandClose } from '../classes/command-close';
import { getPathGeometriesUtil } from './get-path-geometries.util';

const ZERO = 0;
const ONE = 1;
const TWO = 2;
const MINIMUM_FACE_VERTEX_COUNT = 3;
const DEGREES_IN_HALF_TURN = 180;
const HALF_TURN = Math.PI;
const FULL_TURN = Math.PI * TWO;

interface BasePrimitive {
  readonly index: number;
  readonly start: Point;
  readonly end: Point;
}

interface LinePrimitive extends BasePrimitive {
  readonly kind: 'line';
}

interface ArcPrimitive extends BasePrimitive {
  readonly kind: 'arc';
  readonly centerX: number;
  readonly centerY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly axisRotation: number;
  readonly startAngle: number;
  readonly deltaAngle: number;
  readonly sourceVertex: Vertex | undefined;
}

type Primitive = ArcPrimitive | LinePrimitive;

interface DirectedEdge {
  readonly fromKey: string;
  readonly toKey: string;
}

interface NormalizedArc {
  readonly x: number;
  readonly y: number;
  readonly radiusX: number;
  readonly radiusY: number;
}

function getDirectedEdgeKey(edge: DirectedEdge): string {
  return `${edge.fromKey}->${edge.toKey}`;
}

function getUndirectedEdgeKey(firstKey: string, secondKey: string): string {
  return firstKey < secondKey ? `${firstKey}|${secondKey}` : `${secondKey}|${firstKey}`;
}

function isEqual(first: number, second: number): boolean {
  return first === second;
}

function getGraphNodeKey(nodes: Map<string, SplitGraphNode>, point: Point): string {
  for (const node of nodes.values()) {
    if (Point.isEqual(node.point, point)) {
      return node.key;
    }
  }

  return Vector.pointKey(point);
}

function getSegmentIntersection(firstSegment: SplitSegment, secondSegment: SplitSegment): Point | undefined {
  const p = firstSegment.start;
  const q = secondSegment.start;
  const r = Vector.subtract(firstSegment.end, firstSegment.start);
  const s = Vector.subtract(secondSegment.end, secondSegment.start);
  const denominator = Vector.cross(r, s);
  const qMinusP = Vector.subtract(q, p);

  if (denominator === ZERO) {
    return undefined;
  }

  const firstT = Vector.cross(qMinusP, s) / denominator;
  const secondT = Vector.cross(qMinusP, r) / denominator;

  if (firstT < ZERO || firstT > ONE || secondT < ZERO || secondT > ONE) {
    return undefined;
  }

  return firstSegment.pointAt(firstT);
}

function getVectorAngle(from: Vector, to: Vector): number {
  return Math.atan2(Vector.cross(from, to), Vector.dot(from, to));
}

function normalizeArcRadii(
  start: Point,
  end: Point,
  radiusX: number,
  radiusY: number,
  cosRotation: number,
  sinRotation: number,
): NormalizedArc {
  const midpointDeltaX = (start.x - end.x) / TWO;
  const midpointDeltaY = (start.y - end.y) / TWO;
  const x = cosRotation * midpointDeltaX + sinRotation * midpointDeltaY;
  const y = -sinRotation * midpointDeltaX + cosRotation * midpointDeltaY;
  let normalizedRadiusX = Math.abs(radiusX);
  let normalizedRadiusY = Math.abs(radiusY);
  const radiusScale = x ** TWO / normalizedRadiusX ** TWO + y ** TWO / normalizedRadiusY ** TWO;

  if (radiusScale > ONE) {
    const scale = Math.sqrt(radiusScale);
    normalizedRadiusX *= scale;
    normalizedRadiusY *= scale;
  }

  return {
    x,
    y,
    radiusX: normalizedRadiusX,
    radiusY: normalizedRadiusY,
  };
}

function getArcDeltaAngle(sweepFlag: number, startVector: Vector, endVector: Vector): number {
  let deltaAngle = getVectorAngle(startVector, endVector);

  if (sweepFlag === ZERO && deltaAngle > ZERO) {
    deltaAngle -= FULL_TURN;
  } else if (sweepFlag === ONE && deltaAngle < ZERO) {
    deltaAngle += FULL_TURN;
  }

  return deltaAngle;
}

function getArcCenterPrime(normalizedArc: NormalizedArc, parameters: SvgArcEndpointParameters, ratio: number): Point {
  const sign = parameters.largeArcFlag === parameters.sweepFlag ? -ONE : ONE;
  const coefficient = sign * Math.sqrt(ratio);

  return new Point(
    (coefficient * normalizedArc.radiusX * normalizedArc.y) / normalizedArc.radiusY,
    (-coefficient * normalizedArc.radiusY * normalizedArc.x) / normalizedArc.radiusX,
  );
}

function getArcCenter(start: Point, end: Point, centerPrime: Point, cosRotation: number, sinRotation: number): Point {
  return new Point(
    cosRotation * centerPrime.x - sinRotation * centerPrime.y + (start.x + end.x) / TWO,
    sinRotation * centerPrime.x + cosRotation * centerPrime.y + (start.y + end.y) / TWO,
  );
}

function getArcVectors(normalizedArc: NormalizedArc, centerPrime: Point): { endVector: Vector; startVector: Vector } {
  return {
    startVector: new Vector(
      (normalizedArc.x - centerPrime.x) / normalizedArc.radiusX,
      (normalizedArc.y - centerPrime.y) / normalizedArc.radiusY,
    ),
    endVector: new Vector(
      (-normalizedArc.x - centerPrime.x) / normalizedArc.radiusX,
      (-normalizedArc.y - centerPrime.y) / normalizedArc.radiusY,
    ),
  };
}

function createArcPrimitive(
  index: number,
  start: Point,
  parameters: SvgArcEndpointParameters,
  sourceVertex?: Vertex,
): ArcPrimitive | undefined {
  if (parameters.radiusX === ZERO || parameters.radiusY === ZERO) {
    return undefined;
  }

  const { end } = parameters;
  const axisRotation = (parameters.axisRotation * HALF_TURN) / DEGREES_IN_HALF_TURN;
  const cosRotation = Math.cos(axisRotation);
  const sinRotation = Math.sin(axisRotation);
  const normalizedArc = normalizeArcRadii(start, end, parameters.radiusX, parameters.radiusY, cosRotation, sinRotation);
  const radiusXSquared = normalizedArc.radiusX ** TWO;
  const radiusYSquared = normalizedArc.radiusY ** TWO;
  const xSquared = normalizedArc.x ** TWO;
  const ySquared = normalizedArc.y ** TWO;
  const numerator = radiusXSquared * radiusYSquared - radiusXSquared * ySquared - radiusYSquared * xSquared;
  const denominator = radiusXSquared * ySquared + radiusYSquared * xSquared;

  if (denominator === ZERO) {
    return undefined;
  }

  const centerPrime = getArcCenterPrime(normalizedArc, parameters, numerator / denominator);
  const center = getArcCenter(start, end, centerPrime, cosRotation, sinRotation);
  const { startVector, endVector } = getArcVectors(normalizedArc, centerPrime);

  return {
    kind: 'arc',
    index,
    start,
    end,
    centerX: center.x,
    centerY: center.y,
    radiusX: normalizedArc.radiusX,
    radiusY: normalizedArc.radiusY,
    axisRotation,
    startAngle: getVectorAngle(new Vector(ONE, ZERO), startVector),
    deltaAngle: getArcDeltaAngle(parameters.sweepFlag, startVector, endVector),
    sourceVertex,
  };
}

function getPrimitivePoint(primitive: Primitive, t: number): Point {
  if (primitive.kind === 'line') {
    return new Point(
      primitive.start.x + (primitive.end.x - primitive.start.x) * t,
      primitive.start.y + (primitive.end.y - primitive.start.y) * t,
    );
  }

  const angle = primitive.startAngle + primitive.deltaAngle * t;
  const cosRotation = Math.cos(primitive.axisRotation);
  const sinRotation = Math.sin(primitive.axisRotation);
  const x = primitive.radiusX * Math.cos(angle);
  const y = primitive.radiusY * Math.sin(angle);

  return new Point(
    primitive.centerX + cosRotation * x - sinRotation * y,
    primitive.centerY + sinRotation * x + cosRotation * y,
  );
}

function isPointOnEdge(point: Point, start: Point, end: Point): boolean {
  const edge = Vector.subtract(end, start);
  const pointDirection = Vector.subtract(point, start);
  const lengthSquared = Vector.dot(edge, edge);
  const t = lengthSquared === ZERO ? ZERO : Vector.dot(pointDirection, edge) / lengthSquared;

  return Vector.cross(edge, pointDirection) === ZERO && t >= ZERO && t <= ONE;
}

function getVertexArcCommandCount(vertex: Vertex): number {
  void vertex;

  return ONE;
}

function canVertexCreateCornerArc(path: Path, vertex: Vertex, index: number): boolean {
  if (vertex.customCornerArc !== undefined) {
    return true;
  }

  const previousVertex = path.vertices[(index - ONE + path.vertices.length) % path.vertices.length];
  const nextVertex = path.vertices[(index + ONE) % path.vertices.length];

  if (previousVertex === undefined || nextVertex === undefined || vertex.cornerRadius <= ZERO) {
    return false;
  }

  try {
    const cornerGeometry = new CornerGeometry(previousVertex, vertex, nextVertex);
    void cornerGeometry;

    return true;
  } catch {
    return false;
  }
}

function getArcSourceVertices(path: Path): Vertex[] {
  return path.vertices.flatMap((vertex, index) => {
    const isOpenEndpoint = !path.isPathClosed && (index === ZERO || index === path.vertices.length - ONE);

    if (isOpenEndpoint || !canVertexCreateCornerArc(path, vertex, index)) {
      return [];
    }

    return Array.from({ length: getVertexArcCommandCount(vertex) }, () => vertex);
  });
}

function parsePathPrimitives(path: Path): Primitive[] {
  const arcSourceVertices = getArcSourceVertices(path);
  let arcSourceVertexIndex = ZERO;
  let currentPoint: Point | undefined;
  let lastPoint: Point | undefined;
  let subpathStart: Point | undefined;

  const primitives: Primitive[] = [];

  path.commands.forEach((command) => {
    if (command instanceof CommandMove) {
      subpathStart = new Point(command.x, command.y);
      lastPoint = new Point(command.x, command.y);
    } else if (command instanceof CommandLine && lastPoint) {
      currentPoint = new Point(command.x, command.y);

      primitives.push({
        kind: 'line',
        index: primitives.length,
        start: lastPoint,
        end: currentPoint,
      });

      lastPoint = currentPoint;
    } else if (command instanceof CommandArc && lastPoint) {
      const arcParameters: SvgArcEndpointParameters = {
        radiusX: command.radiusX,
        radiusY: command.radiusY,
        axisRotation: command.axisRotation,
        largeArcFlag: command.largeArcFlag,
        sweepFlag: command.sweepFlag,
        end: new Point(command.endX, command.endY),
      };

      const sourceVertex = arcSourceVertices[arcSourceVertexIndex];
      arcSourceVertexIndex += ONE;

      const arcPrimitive = createArcPrimitive(primitives.length, lastPoint, arcParameters, sourceVertex);

      if (arcPrimitive) {
        primitives.push(arcPrimitive);
      } else {
        primitives.push({
          kind: 'line',
          index: primitives.length,
          start: lastPoint,
          end: arcParameters.end,
        });
      }

      lastPoint = arcParameters.end;
    } else if (command instanceof CommandClose && lastPoint && subpathStart) {
      primitives.push({
        kind: 'line',
        index: primitives.length,
        start: lastPoint,
        end: subpathStart,
      });

      lastPoint = subpathStart;
    }
  });

  return primitives;
}

function getSortedSplitPoints(splitPoints: SegmentSplitPoint[]): SegmentSplitPoint[] {
  return splitPoints
    .filter(({ t }) => t >= ZERO && t <= ONE)
    .sort((first, second) => first.t - second.t)
    .filter((splitPoint, index, sortedSplitPoints) => {
      const previousSplitPoint = sortedSplitPoints[index - ONE];

      return !previousSplitPoint || !isEqual(splitPoint.t, previousSplitPoint.t);
    });
}

function getPrimitiveBaseSegment(primitive: Primitive): SplitSegment {
  return new SplitSegment(primitive.start, primitive.end, primitive.index, ZERO, ONE);
}

function getArcPointParameter(arc: ArcPrimitive, point: Point): number {
  const cosRotation = Math.cos(arc.axisRotation);
  const sinRotation = Math.sin(arc.axisRotation);
  const translatedX = point.x - arc.centerX;
  const translatedY = point.y - arc.centerY;
  const x = (cosRotation * translatedX + sinRotation * translatedY) / arc.radiusX;
  const y = (-sinRotation * translatedX + cosRotation * translatedY) / arc.radiusY;
  const angle = Math.atan2(y, x);
  let deltaAngle = angle - arc.startAngle;

  if (arc.deltaAngle >= ZERO) {
    while (deltaAngle < ZERO) {
      deltaAngle += FULL_TURN;
    }
  } else {
    while (deltaAngle > ZERO) {
      deltaAngle -= FULL_TURN;
    }
  }

  return deltaAngle / arc.deltaAngle;
}

function getLineArcIntersectionSplitPoints(
  line: LinePrimitive,
  arc: ArcPrimitive,
): { arcSplitPoint: SegmentSplitPoint; lineSplitPoint: SegmentSplitPoint }[] {
  const cosRotation = Math.cos(arc.axisRotation);
  const sinRotation = Math.sin(arc.axisRotation);
  const lineDeltaX = line.end.x - line.start.x;
  const lineDeltaY = line.end.y - line.start.y;
  const startX = cosRotation * (line.start.x - arc.centerX) + sinRotation * (line.start.y - arc.centerY);
  const startY = -sinRotation * (line.start.x - arc.centerX) + cosRotation * (line.start.y - arc.centerY);
  const deltaX = cosRotation * lineDeltaX + sinRotation * lineDeltaY;
  const deltaY = -sinRotation * lineDeltaX + cosRotation * lineDeltaY;
  const a = deltaX ** TWO / arc.radiusX ** TWO + deltaY ** TWO / arc.radiusY ** TWO;
  const b = (TWO * startX * deltaX) / arc.radiusX ** TWO + (TWO * startY * deltaY) / arc.radiusY ** TWO;
  const c = startX ** TWO / arc.radiusX ** TWO + startY ** TWO / arc.radiusY ** TWO - ONE;
  const discriminant = b ** TWO - TWO * TWO * a * c;

  if (a === ZERO || discriminant < ZERO) {
    return [];
  }

  return [(-b - Math.sqrt(discriminant)) / (TWO * a), (-b + Math.sqrt(discriminant)) / (TWO * a)].flatMap((lineT) => {
    if (lineT < ZERO || lineT > ONE) {
      return [];
    }

    const point = new Point(line.start.x + lineDeltaX * lineT, line.start.y + lineDeltaY * lineT);
    const arcT = getArcPointParameter(arc, point);

    if (arcT < ZERO || arcT > ONE) {
      return [];
    }

    return [
      {
        lineSplitPoint: new SegmentSplitPoint(point, lineT),
        arcSplitPoint: new SegmentSplitPoint(point, arcT),
      },
    ];
  });
}

function addPrimitiveIntersectionSplitPoints(
  firstPrimitive: Primitive,
  secondPrimitive: Primitive,
  splitPointMap: Map<number, SegmentSplitPoint[]>,
): void {
  if (firstPrimitive.kind === 'line' && secondPrimitive.kind === 'line') {
    const intersection = getSegmentIntersection(
      getPrimitiveBaseSegment(firstPrimitive),
      getPrimitiveBaseSegment(secondPrimitive),
    );

    if (intersection) {
      splitPointMap
        .get(firstPrimitive.index)
        ?.push(new SegmentSplitPoint(intersection, getPrimitiveBaseSegment(firstPrimitive).getParameter(intersection)));
      splitPointMap
        .get(secondPrimitive.index)
        ?.push(
          new SegmentSplitPoint(intersection, getPrimitiveBaseSegment(secondPrimitive).getParameter(intersection)),
        );
    }

    return;
  }

  if (firstPrimitive.kind === 'line' && secondPrimitive.kind === 'arc') {
    for (const { arcSplitPoint, lineSplitPoint } of getLineArcIntersectionSplitPoints(
      firstPrimitive,
      secondPrimitive,
    )) {
      splitPointMap.get(firstPrimitive.index)?.push(lineSplitPoint);
      splitPointMap.get(secondPrimitive.index)?.push(arcSplitPoint);
    }

    return;
  }

  if (firstPrimitive.kind === 'arc' && secondPrimitive.kind === 'line') {
    for (const { arcSplitPoint, lineSplitPoint } of getLineArcIntersectionSplitPoints(
      secondPrimitive,
      firstPrimitive,
    )) {
      splitPointMap.get(firstPrimitive.index)?.push(arcSplitPoint);
      splitPointMap.get(secondPrimitive.index)?.push(lineSplitPoint);
    }
  }
}

function createPrimitiveSplitPointMap(primitives: Primitive[]): Map<number, SegmentSplitPoint[]> {
  const splitPointMap = new Map(
    primitives.map((primitive) => [
      primitive.index,
      [new SegmentSplitPoint(primitive.start, ZERO), new SegmentSplitPoint(primitive.end, ONE)],
    ]),
  );

  for (let firstIndex = ZERO; firstIndex < primitives.length; firstIndex += ONE) {
    const firstPrimitive = primitives[firstIndex];

    if (!firstPrimitive) {
      continue;
    }

    for (let secondIndex = firstIndex + ONE; secondIndex < primitives.length; secondIndex += ONE) {
      const secondPrimitive = primitives[secondIndex];

      if (secondPrimitive) {
        addPrimitiveIntersectionSplitPoints(firstPrimitive, secondPrimitive, splitPointMap);
      }
    }
  }

  return splitPointMap;
}

function getSplitPrimitiveSegments(primitives: Primitive[]): SplitSegment[] {
  const splitPointMap = createPrimitiveSplitPointMap(primitives);
  const splitSegments: SplitSegment[] = [];

  for (const primitive of primitives) {
    const splitPoints = getSortedSplitPoints(splitPointMap.get(primitive.index) ?? []);

    for (let index = ZERO; index < splitPoints.length - ONE; index += ONE) {
      const start = splitPoints[index];
      const end = splitPoints[index + ONE];

      if (!start || !end || Point.isEqual(start.point, end.point)) {
        continue;
      }

      splitSegments.push(new SplitSegment(start.point, end.point, primitive.index, start.t, end.t));
    }
  }

  return splitSegments;
}

function addGraphEdge(
  nodes: Map<string, SplitGraphNode>,
  adjacency: Map<string, string[]>,
  edgeCommands: Map<string, SplitEdgeCommand>,
  segment: SplitSegment,
): void {
  const startKey = getGraphNodeKey(nodes, segment.start);
  const endKey = getGraphNodeKey(nodes, segment.end);
  const edgeKey = getUndirectedEdgeKey(startKey, endKey);

  if (startKey === endKey || edgeCommands.has(edgeKey)) {
    return;
  }

  nodes.set(startKey, new SplitGraphNode(startKey, segment.start));
  nodes.set(endKey, new SplitGraphNode(endKey, segment.end));
  edgeCommands.set(
    edgeKey,
    new SplitEdgeCommand(startKey, endKey, segment.primitiveIndex, segment.tStart, segment.tEnd),
  );

  adjacency.set(startKey, [...(adjacency.get(startKey) ?? []), endKey]);
  adjacency.set(endKey, [...(adjacency.get(endKey) ?? []), startKey]);
}

function sortGraphAdjacency(nodes: Map<string, SplitGraphNode>, adjacency: Map<string, string[]>): void {
  for (const [nodeKey, neighborKeys] of adjacency) {
    const node = nodes.get(nodeKey);

    if (!node) {
      continue;
    }

    neighborKeys.sort((firstKey, secondKey) => {
      const firstNode = nodes.get(firstKey);
      const secondNode = nodes.get(secondKey);

      if (!firstNode || !secondNode) {
        return ZERO;
      }

      const firstAngle = Math.atan2(firstNode.point.y - node.point.y, firstNode.point.x - node.point.x);
      const secondAngle = Math.atan2(secondNode.point.y - node.point.y, secondNode.point.x - node.point.x);

      return firstAngle - secondAngle;
    });
  }
}

function getPreviousNeighborKey(neighborKeys: string[], fromKey: string): string | undefined {
  const incomingIndex = neighborKeys.indexOf(fromKey);

  if (incomingIndex < ZERO) {
    return undefined;
  }

  return neighborKeys[(incomingIndex - ONE + neighborKeys.length) % neighborKeys.length];
}

function getFaceArea(points: Point[]): number {
  return (
    points.reduce((area, point, index) => {
      const nextPoint = points[(index + ONE) % points.length];

      return nextPoint ? area + point.x * nextPoint.y - nextPoint.x * point.y : area;
    }, ZERO) / TWO
  );
}

function getCanonicalFaceKey(faceKeys: string[]): string {
  let canonicalKeys = faceKeys;

  for (let index = ONE; index < faceKeys.length; index += ONE) {
    const rotatedKeys = [...faceKeys.slice(index), ...faceKeys.slice(ZERO, index)];

    if (rotatedKeys.join('|') < canonicalKeys.join('|')) {
      canonicalKeys = rotatedKeys;
    }
  }

  return canonicalKeys.join('|');
}

function walkFace(
  startEdge: DirectEdge,
  visitedDirectedEdges: Set<string>,
  adjacency: Map<string, string[]>,
): string[] {
  const faceKeys: string[] = [];
  let currentFromKey = startEdge.from.key;
  let currentToKey = startEdge.to.key;

  while (!visitedDirectedEdges.has(getDirectedEdgeKey({ fromKey: currentFromKey, toKey: currentToKey }))) {
    visitedDirectedEdges.add(getDirectedEdgeKey({ fromKey: currentFromKey, toKey: currentToKey }));
    faceKeys.push(currentFromKey);

    const currentNeighborKeys = adjacency.get(currentToKey);
    const nextToKey =
      currentNeighborKeys === undefined ? undefined : getPreviousNeighborKey(currentNeighborKeys, currentFromKey);

    if (nextToKey === undefined) {
      break;
    }

    currentFromKey = currentToKey;
    currentToKey = nextToKey;
  }

  return faceKeys;
}

function isValidFace(faceKeys: string[], nodes: Map<string, SplitGraphNode>): boolean {
  if (faceKeys.length < MINIMUM_FACE_VERTEX_COUNT) {
    return false;
  }

  const points = faceKeys.flatMap((key) => {
    const node = nodes.get(key);

    return node ? [node.point] : [];
  });

  return getFaceArea(points) > ZERO;
}

function getEdgeCommand(
  edgeCommands: Map<string, SplitEdgeCommand>,
  fromKey: string,
  toKey: string,
): SplitEdgeCommand | undefined {
  const edgeCommand = edgeCommands.get(getUndirectedEdgeKey(fromKey, toKey));

  if (!edgeCommand) {
    return undefined;
  }

  if (edgeCommand.fromKey === fromKey && edgeCommand.toKey === toKey) {
    return edgeCommand;
  }

  return edgeCommand.reversed();
}

function getFaceEdgeCommands(faceKeys: string[], edgeCommands: Map<string, SplitEdgeCommand>): SplitEdgeCommand[] {
  return faceKeys.flatMap((fromKey, index) => {
    const toKey = faceKeys[(index + ONE) % faceKeys.length];
    const edgeCommand = toKey === undefined ? undefined : getEdgeCommand(edgeCommands, fromKey, toKey);

    return edgeCommand ? [edgeCommand] : [];
  });
}

function mergeEdgeCommands(edgeCommands: SplitEdgeCommand[]): SplitEdgeCommand[] {
  return edgeCommands.reduce<SplitEdgeCommand[]>((mergedEdgeCommands, edgeCommand) => {
    const previousEdgeCommand = mergedEdgeCommands[mergedEdgeCommands.length - ONE];

    if (
      previousEdgeCommand?.primitiveIndex === edgeCommand.primitiveIndex &&
      isEqual(previousEdgeCommand.tEnd, edgeCommand.tStart)
    ) {
      mergedEdgeCommands[mergedEdgeCommands.length - ONE] = new SplitEdgeCommand(
        previousEdgeCommand.fromKey,
        edgeCommand.toKey,
        previousEdgeCommand.primitiveIndex,
        previousEdgeCommand.tStart,
        edgeCommand.tEnd,
      );

      return mergedEdgeCommands;
    }

    mergedEdgeCommands.push(edgeCommand);

    return mergedEdgeCommands;
  }, []);
}

function getArcSweepFlag(primitive: ArcPrimitive, fromT: number, toT: number): number {
  return primitive.deltaAngle * (toT - fromT) >= ZERO ? ONE : ZERO;
}

function getArcLargeArcFlag(primitive: ArcPrimitive, fromT: number, toT: number): number {
  return Math.abs(primitive.deltaAngle * (toT - fromT)) > Math.PI ? ONE : ZERO;
}

function getArcRunEndIndex(edgeCommands: SplitEdgeCommand[], primitives: Primitive[], startIndex: number): number {
  let endIndex = startIndex;

  while (endIndex + ONE < edgeCommands.length) {
    const nextEdgeCommand = edgeCommands[endIndex + ONE];
    const nextPrimitive = nextEdgeCommand ? primitives[nextEdgeCommand.primitiveIndex] : undefined;

    if (nextPrimitive?.kind !== 'arc') {
      break;
    }

    endIndex += ONE;
  }

  return endIndex;
}

function cloneVertex(vertex: Vertex, customCornerArc = vertex.customCornerArc): Vertex {
  return new Vertex(vertex.x, vertex.y, vertex.cornerRadius, customCornerArc);
}

function clonePlainVertex(vertex: Vertex): Vertex {
  return new Vertex(vertex.x, vertex.y, vertex.cornerRadius);
}

function addModelVertex(vertices: Vertex[], vertex: Vertex): void {
  const previousVertex = vertices[vertices.length - ONE];

  if (
    previousVertex &&
    isEqual(previousVertex.x, vertex.x) &&
    isEqual(previousVertex.y, vertex.y) &&
    previousVertex.cornerRadius === vertex.cornerRadius
  ) {
    return;
  }

  vertices.push(vertex);
}

function getCornerTangentOffsets(vertices: Vertex[]): number[] {
  const cornerGeometries = vertices.map((vertex, index) => {
    const previousVertex = vertices[(index - ONE + vertices.length) % vertices.length];
    const nextVertex = vertices[(index + ONE) % vertices.length];

    if (!previousVertex || !nextVertex || vertex.cornerRadius <= ZERO || vertex.customCornerArc !== undefined) {
      return undefined;
    }

    try {
      return new CornerGeometry(previousVertex, vertex, nextVertex);
    } catch {
      return undefined;
    }
  });
  const normalizedCornerOffsets = cornerGeometries.map((cornerGeometry) => {
    const offset = cornerGeometry?.tangentOffset ?? ZERO;

    return {
      incoming: offset,
      outgoing: offset,
    };
  });

  for (let index = ZERO; index < vertices.length; index += ONE) {
    const currentGeometry = cornerGeometries[index];
    const nextIndex = (index + ONE) % vertices.length;
    const nextGeometry = cornerGeometries[nextIndex];
    const currentTangentOffset = currentGeometry?.tangentOffset ?? ZERO;
    const nextTangentOffset = nextGeometry?.tangentOffset ?? ZERO;
    const totalOffset = currentTangentOffset + nextTangentOffset;
    const currentVertex = vertices[index];
    const nextVertex = vertices[nextIndex];
    const edgeLength = currentVertex && nextVertex ? currentVertex.vectorTo(nextVertex).length : undefined;

    if (edgeLength === undefined || edgeLength === ZERO || totalOffset <= edgeLength) {
      continue;
    }

    const scale = edgeLength / totalOffset;

    const currentOffsets = normalizedCornerOffsets[index];
    const nextOffsets = normalizedCornerOffsets[nextIndex];

    if (currentTangentOffset > ZERO && currentOffsets) {
      currentOffsets.outgoing = currentTangentOffset * scale;
    }

    if (nextTangentOffset > ZERO && nextOffsets) {
      nextOffsets.incoming = nextTangentOffset * scale;
    }
  }

  return normalizedCornerOffsets.map((offsets) => Math.min(offsets.incoming, offsets.outgoing));
}

function getComputedArcEntry(vertex: Vertex, vertices: Vertex[], index: number): Point | undefined {
  if (vertex.customCornerArc !== undefined) {
    return new Point(vertex.customCornerArc.entry.x, vertex.customCornerArc.entry.y);
  }

  if (vertex.cornerRadius <= ZERO) {
    return undefined;
  }

  const previousVertex = vertices[(index - ONE + vertices.length) % vertices.length];
  const nextVertex = vertices[(index + ONE) % vertices.length];

  if (!previousVertex || !nextVertex) {
    return undefined;
  }

  try {
    const geometry = new CornerGeometry(previousVertex, vertex, nextVertex);
    const tangentOffset = getCornerTangentOffsets(vertices)[index];

    if (tangentOffset === undefined || tangentOffset <= ZERO) {
      return undefined;
    }

    return new Point(
      vertex.x + geometry.incomingUnitVector.x * tangentOffset,
      vertex.y + geometry.incomingUnitVector.y * tangentOffset,
    );
  } catch {
    return undefined;
  }
}

function getEdgeCommandEndVertex(
  edgeCommand: SplitEdgeCommand,
  primitive: Primitive,
  nodes: Map<string, SplitGraphNode>,
): Vertex {
  const end = nodes.get(edgeCommand.toKey)?.point ?? getPrimitivePoint(primitive, edgeCommand.tEnd);

  return new Vertex(end.x, end.y);
}

function getArcRunSourceVertexSimpler(edgeCommands: SplitEdgeCommand[], primitives: Primitive[]): Vertex | undefined {
  for (let index = edgeCommands.length - ONE; index >= ZERO; index -= ONE) {
    const edgeCommand = edgeCommands[index];
    const primitive = edgeCommand ? primitives[edgeCommand.primitiveIndex] : undefined;

    if (primitive?.kind === 'arc' && primitive.sourceVertex !== undefined) {
      return primitive.sourceVertex;
    }
  }

  return undefined;
}

function isCustomCornerArcEntryVertex(vertex: Vertex, nextVertex: Vertex): boolean {
  const { customCornerArc } = nextVertex;

  return customCornerArc !== undefined && Point.isEqual(vertex, customCornerArc.entry);
}

function shouldAbsorbPreviousArcExit(previousVertex: Vertex, vertex: Vertex, nextVertex: Vertex): boolean {
  return (
    isPlainVertex(vertex) &&
    previousVertex.customCornerArc !== undefined &&
    (Point.isEqual(vertex, nextVertex) || nextVertex.cornerRadius > ZERO || nextVertex.customCornerArc !== undefined)
  );
}

function shouldMoveCurrentArcToNextVertex(
  previousVertex: Vertex | undefined,
  vertex: Vertex,
  nextVertex: Vertex,
): boolean {
  return (
    previousVertex?.customCornerArc !== undefined &&
    vertex.customCornerArc !== undefined &&
    Point.isEqual(vertex, vertex.customCornerArc.entry) &&
    isPlainVertex(nextVertex) &&
    Point.isEqual(nextVertex, vertex.customCornerArc.exit)
  );
}

function compactModelVertices(vertices: Vertex[]): Vertex[] {
  const compactedVertices = vertices.reduce<Vertex[]>((compacted, vertex, index, sourceVertices) => {
    const previousVertex = compacted[compacted.length - ONE];
    const nextIndex = (index + ONE) % sourceVertices.length;
    const nextVertex = sourceVertices[nextIndex];

    if (previousVertex && Point.isEqual(previousVertex, vertex)) {
      if (previousVertex.customCornerArc === undefined && vertex.customCornerArc !== undefined) {
        compacted[compacted.length - ONE] = vertex;
      }

      return compacted;
    }

    if (
      previousVertex &&
      isCustomCornerArcEntryVertex(previousVertex, vertex) &&
      vertex.customCornerArc === undefined
    ) {
      compacted[compacted.length - ONE] = vertex;

      return compacted;
    }

    if (previousVertex && nextVertex && shouldAbsorbPreviousArcExit(previousVertex, vertex, nextVertex)) {
      return compacted;
    }

    if (nextVertex && nextIndex !== ZERO && shouldMoveCurrentArcToNextVertex(previousVertex, vertex, nextVertex)) {
      compacted.push(cloneVertex(nextVertex, vertex.customCornerArc));

      return compacted;
    }

    compacted.push(vertex);

    return compacted;
  }, []);

  const firstVertex = compactedVertices[ZERO];
  const lastVertex = compactedVertices[compactedVertices.length - ONE];

  if (firstVertex && lastVertex && compactedVertices.length > ONE && Point.isEqual(firstVertex, lastVertex)) {
    return compactedVertices.slice(ZERO, -ONE);
  }

  return compactedVertices;
}

function isPlainVertex(vertex: Vertex): boolean {
  return vertex.customCornerArc === undefined && vertex.cornerRadius === ZERO;
}

function isRedundantStraightVertex(previousVertex: Vertex, vertex: Vertex, nextVertex: Vertex): boolean {
  return (
    isPlainVertex(vertex) &&
    isPointOnEdge(vertex, previousVertex, nextVertex) &&
    !Point.isEqual(previousVertex, vertex) &&
    !Point.isEqual(vertex, nextVertex)
  );
}

function removeRedundantStraightVertices(vertices: Vertex[]): Vertex[] {
  return vertices.filter((vertex, index) => {
    const previousVertex = vertices[(index - ONE + vertices.length) % vertices.length];
    const nextVertex = vertices[(index + ONE) % vertices.length];

    return !previousVertex || !nextVertex || !isRedundantStraightVertex(previousVertex, vertex, nextVertex);
  });
}

function removePreviousArcExitVertices(vertices: Vertex[]): Vertex[] {
  if (vertices.length <= MINIMUM_FACE_VERTEX_COUNT) {
    return vertices;
  }

  return vertices.filter((vertex, index) => {
    const previousVertex = vertices[(index - ONE + vertices.length) % vertices.length];
    const nextVertex = vertices[(index + ONE) % vertices.length];

    return (
      !previousVertex ||
      !nextVertex ||
      !(
        isPlainVertex(vertex) &&
        previousVertex.customCornerArc !== undefined &&
        Point.isEqual(vertex, previousVertex.customCornerArc.exit) &&
        (nextVertex.cornerRadius > ZERO || nextVertex.customCornerArc !== undefined)
      )
    );
  });
}

function removeArcEntryVertices(vertices: Vertex[]): Vertex[] {
  if (vertices.length <= MINIMUM_FACE_VERTEX_COUNT + ONE) {
    return vertices;
  }

  return vertices.filter((vertex, index) => {
    const nextVertex = vertices[(index + ONE) % vertices.length];
    const nextEntryPoint =
      nextVertex === undefined ? undefined : getComputedArcEntry(nextVertex, vertices, (index + ONE) % vertices.length);

    return nextEntryPoint === undefined || !Point.isEqual(vertex, nextEntryPoint);
  });
}

function collapseTechnicalArcExitVertices(vertices: Vertex[]): Vertex[] {
  if (vertices.length <= MINIMUM_FACE_VERTEX_COUNT) {
    return vertices;
  }

  return vertices.filter((vertex, index) => {
    const previousVertex = vertices[(index - ONE + vertices.length) % vertices.length];
    const nextVertex = vertices[(index + ONE) % vertices.length];

    return !(
      previousVertex?.customCornerArc !== undefined &&
      isPlainVertex(vertex) &&
      Point.isEqual(vertex, previousVertex.customCornerArc.exit) &&
      (nextVertex?.cornerRadius ?? ZERO) > ZERO
    );
  });
}

function normalizeClosingTechnicalArcVertex(vertices: Vertex[]): Vertex[] {
  const firstVertex = vertices[ZERO];
  const lastVertex = vertices[vertices.length - ONE];
  const closingArc = lastVertex?.customCornerArc;

  if (
    vertices.length <= MINIMUM_FACE_VERTEX_COUNT ||
    firstVertex === undefined ||
    lastVertex === undefined ||
    closingArc === undefined ||
    !Point.isEqual(lastVertex, closingArc.entry) ||
    !Point.isEqual(firstVertex, closingArc.exit) ||
    firstVertex.customCornerArc !== undefined ||
    closingArc.radiusX > firstVertex.vectorTo(vertices[ONE] ?? firstVertex).length ||
    closingArc.radiusY > firstVertex.vectorTo(vertices[ONE] ?? firstVertex).length
  ) {
    return vertices;
  }

  return [...vertices.slice(ONE, -ONE), cloneVertex(firstVertex, closingArc)];
}

function normalizeLeadingArcIntoNextRoundedCorner(vertices: Vertex[]): Vertex[] {
  const firstVertex = vertices[ZERO];
  const secondVertex = vertices[ONE];
  const thirdVertex = vertices[TWO];
  const firstArc = firstVertex?.customCornerArc;
  const secondArc = secondVertex?.customCornerArc;

  if (
    vertices.length !== MINIMUM_FACE_VERTEX_COUNT ||
    firstArc === undefined ||
    secondArc === undefined ||
    secondVertex === undefined ||
    thirdVertex === undefined ||
    secondVertex.cornerRadius <= ZERO ||
    !Point.isEqual(firstArc.exit, secondArc.entry)
  ) {
    return vertices;
  }

  const leadingPoint = new Vertex(secondArc.entry.x, secondArc.entry.y);
  const roundedVertex = overrideCustomCornerArcEntry(secondVertex, secondVertex);
  const lowerCornerPoint = roundedVertex.customCornerArc?.exit;
  const roundedArc = roundedVertex.customCornerArc;

  if (lowerCornerPoint === undefined || roundedArc === undefined) {
    return [leadingPoint, roundedVertex, thirdVertex];
  }

  const upperCornerPoint = new Point(lowerCornerPoint.x, thirdVertex.y - (lowerCornerPoint.y - thirdVertex.y));
  const cornerRadius = thirdVertex.vectorTo(upperCornerPoint).length;
  const bottomArcVertex = cloneVertex(new Vertex(roundedVertex.x, roundedVertex.y), {
    entry: new Point(lowerCornerPoint.x, lowerCornerPoint.y),
    exit: new Point(roundedVertex.x, roundedVertex.y),
    radiusX: roundedArc.radiusX,
    radiusY: roundedArc.radiusY,
    axisRotation: roundedArc.axisRotation,
    largeArcFlag: roundedArc.largeArcFlag,
    sweepFlag: roundedArc.sweepFlag === ONE ? ZERO : ONE,
  });
  const topArcVertex = cloneVertex(leadingPoint, {
    entry: leadingPoint,
    exit: firstArc.entry,
    radiusX: firstArc.radiusX,
    radiusY: firstArc.radiusY,
    axisRotation: firstArc.axisRotation,
    largeArcFlag: firstArc.largeArcFlag,
    sweepFlag: firstArc.sweepFlag === ONE ? ZERO : ONE,
  });
  const cornerVertex = cloneVertex(new Vertex(thirdVertex.x, thirdVertex.y), {
    entry: upperCornerPoint,
    exit: new Point(lowerCornerPoint.x, lowerCornerPoint.y),
    radiusX: cornerRadius,
    radiusY: cornerRadius,
    axisRotation: ZERO,
    largeArcFlag: ZERO,
    sweepFlag: ZERO,
  });

  return [bottomArcVertex, topArcVertex, cornerVertex];
}

function isPointOnSourceAxis(point: Point, sourceVertex: Vertex): boolean {
  return isEqual(point.x, sourceVertex.x) || isEqual(point.y, sourceVertex.y);
}

function getSourceAxisSplitPoint(
  edgeCommand: SplitEdgeCommand,
  primitive: ArcPrimitive,
  nodes: Map<string, SplitGraphNode>,
): Point | undefined {
  const { sourceVertex } = primitive;

  if (sourceVertex === undefined || sourceVertex.cornerRadius <= ZERO) {
    return undefined;
  }

  const fromPoint = nodes.get(edgeCommand.fromKey)?.point;

  return fromPoint !== undefined && isPointOnSourceAxis(fromPoint, sourceVertex) ? fromPoint : undefined;
}

function getArcRunCustomVertex(
  edgeCommands: SplitEdgeCommand[],
  primitives: Primitive[],
  nodes: Map<string, SplitGraphNode>,
): Vertex | undefined {
  const sourceVertex = getArcRunSourceVertexSimpler(edgeCommands, primitives);
  const firstEdgeCommand = edgeCommands[ZERO];
  const lastEdgeCommand = edgeCommands[edgeCommands.length - ONE];
  const lastPrimitive = lastEdgeCommand ? primitives[lastEdgeCommand.primitiveIndex] : undefined;

  if (!sourceVertex || !firstEdgeCommand || !lastEdgeCommand || lastPrimitive?.kind !== 'arc') {
    return undefined;
  }

  const firstPrimitive = primitives[firstEdgeCommand.primitiveIndex];

  if (firstPrimitive?.kind !== 'arc') {
    return undefined;
  }

  const entry = getPrimitivePoint(firstPrimitive, firstEdgeCommand.tStart);
  const exit = nodes.get(lastEdgeCommand.toKey)?.point ?? getPrimitivePoint(lastPrimitive, lastEdgeCommand.tEnd);
  const logicalPoint = getSourceAxisSplitPoint(lastEdgeCommand, lastPrimitive, nodes) ?? sourceVertex;

  return cloneVertex(new Vertex(logicalPoint.x, logicalPoint.y, sourceVertex.cornerRadius), {
    entry: new Point(entry.x, entry.y),
    exit: new Point(exit.x, exit.y),
    radiusX: lastPrimitive.radiusX,
    radiusY: lastPrimitive.radiusY,
    axisRotation: (lastPrimitive.axisRotation * DEGREES_IN_HALF_TURN) / HALF_TURN,
    largeArcFlag: getArcLargeArcFlag(lastPrimitive, lastEdgeCommand.tStart, lastEdgeCommand.tEnd),
    sweepFlag: getArcSweepFlag(lastPrimitive, lastEdgeCommand.tStart, lastEdgeCommand.tEnd),
  });
}

function getStartAnchoredArcVertex(
  vertex: Vertex,
  edgeCommand: SplitEdgeCommand,
  primitive: ArcPrimitive,
  nodes: Map<string, SplitGraphNode>,
): Vertex | undefined {
  if (edgeCommand.primitiveIndex !== primitive.index) {
    return undefined;
  }

  const exit = nodes.get(edgeCommand.toKey)?.point ?? getPrimitivePoint(primitive, edgeCommand.tEnd);

  return cloneVertex(new Vertex(vertex.x, vertex.y, vertex.cornerRadius), {
    entry: new Point(vertex.x, vertex.y),
    exit: new Point(exit.x, exit.y),
    radiusX: primitive.radiusX,
    radiusY: primitive.radiusY,
    axisRotation: (primitive.axisRotation * DEGREES_IN_HALF_TURN) / HALF_TURN,
    largeArcFlag: getArcLargeArcFlag(primitive, edgeCommand.tStart, edgeCommand.tEnd),
    sweepFlag: getArcSweepFlag(primitive, edgeCommand.tStart, edgeCommand.tEnd),
  });
}

function overrideCustomCornerArcEntry(vertex: Vertex, entryPoint: Point): Vertex {
  if (vertex.customCornerArc === undefined) {
    return vertex;
  }

  return cloneVertex(vertex, {
    ...vertex.customCornerArc,
    entry: new Point(entryPoint.x, entryPoint.y),
  });
}

function getArcRunPlainVertex(edgeCommands: SplitEdgeCommand[], primitives: Primitive[]): Vertex | undefined {
  const sourceVertex = getArcRunSourceVertexSimpler(edgeCommands, primitives);

  return sourceVertex === undefined ? undefined : clonePlainVertex(sourceVertex);
}

function hasMultipleArcPrimitives(edgeCommands: SplitEdgeCommand[], primitives: Primitive[]): boolean {
  const primitiveIndexes = new Set<number>();

  for (const edgeCommand of edgeCommands) {
    const primitive = primitives[edgeCommand.primitiveIndex];

    if (primitive?.kind === 'arc') {
      primitiveIndexes.add(edgeCommand.primitiveIndex);
    }
  }

  return primitiveIndexes.size > ONE;
}

function isCompleteSingleArcRun(edgeCommands: SplitEdgeCommand[], primitives: Primitive[]): boolean {
  const firstEdgeCommand = edgeCommands[ZERO];
  const lastEdgeCommand = edgeCommands[edgeCommands.length - ONE];
  const primitive = firstEdgeCommand ? primitives[firstEdgeCommand.primitiveIndex] : undefined;

  return (
    firstEdgeCommand !== undefined &&
    lastEdgeCommand !== undefined &&
    primitive?.kind === 'arc' &&
    firstEdgeCommand.primitiveIndex === lastEdgeCommand.primitiveIndex &&
    isEqual(firstEdgeCommand.tStart, ZERO) &&
    isEqual(lastEdgeCommand.tEnd, ONE)
  );
}

function isSingleEdgePartialArc(edgeCommand: SplitEdgeCommand | undefined, primitives: Primitive[]): boolean {
  if (!edgeCommand) {
    return false;
  }

  const primitive = primitives[edgeCommand.primitiveIndex];

  return primitive?.kind === 'arc' && (!isEqual(edgeCommand.tStart, ZERO) || !isEqual(edgeCommand.tEnd, ONE));
}

function getArcRunSourceVertices(edgeCommands: SplitEdgeCommand[], primitives: Primitive[]): Vertex[] {
  return edgeCommands.flatMap((edgeCommand) => {
    const primitive = primitives[edgeCommand.primitiveIndex];

    return primitive?.kind === 'arc' && primitive.sourceVertex !== undefined ? [primitive.sourceVertex] : [];
  });
}

function hasDistinctArcRunSourceVertices(edgeCommands: SplitEdgeCommand[], primitives: Primitive[]): boolean {
  const sourceVertices = getArcRunSourceVertices(edgeCommands, primitives);

  return new Set(sourceVertices.map((vertex) => Vector.pointKey(vertex))).size > ONE;
}

function addSplitArcRunVertices(
  vertices: Vertex[],
  edgeCommands: SplitEdgeCommand[],
  primitives: Primitive[],
  nodes: Map<string, SplitGraphNode>,
): void {
  for (let index = ZERO; index < edgeCommands.length; index += ONE) {
    const edgeCommand = edgeCommands[index];
    const primitive = edgeCommand ? primitives[edgeCommand.primitiveIndex] : undefined;

    if (!edgeCommand || primitive?.kind !== 'arc') {
      continue;
    }

    if (isSingleEdgePartialArc(edgeCommand, primitives) && index === ZERO) {
      const anchorVertex = vertices[vertices.length - ONE];

      if (anchorVertex) {
        const anchoredVertex = getStartAnchoredArcVertex(anchorVertex, edgeCommand, primitive, nodes);

        if (anchoredVertex) {
          vertices[vertices.length - ONE] = anchoredVertex;
          continue;
        }
      }
    }

    const customArcVertex = getArcRunCustomVertex([edgeCommand], primitives, nodes);

    if (customArcVertex) {
      addModelVertex(vertices, customArcVertex);
      continue;
    }

    addModelVertex(vertices, getEdgeCommandEndVertex(edgeCommand, primitive, nodes));
  }
}

function getFaceVertices(
  firstNode: SplitGraphNode,
  edgeCommands: SplitEdgeCommand[],
  primitives: Primitive[],
  nodes: Map<string, SplitGraphNode>,
): Vertex[] {
  const vertices: Vertex[] = [new Vertex(firstNode.point.x, firstNode.point.y)];

  for (let index = ZERO; index < edgeCommands.length; index += ONE) {
    const edgeCommand = edgeCommands[index];

    if (!edgeCommand) {
      continue;
    }

    const primitive = primitives[edgeCommand.primitiveIndex];

    if (!primitive) {
      continue;
    }

    if (primitive.kind === 'arc') {
      const runEndIndex = getArcRunEndIndex(edgeCommands, primitives, index);
      const arcRunEdgeCommands = edgeCommands.slice(index, runEndIndex + ONE);
      const customArcRunVertex = getArcRunCustomVertex(arcRunEdgeCommands, primitives, nodes);
      const plainArcRunVertex = getArcRunPlainVertex(arcRunEdgeCommands, primitives);
      const nextEdgeCommand = edgeCommands[runEndIndex + ONE];
      const nextNextEdgeCommand = edgeCommands[runEndIndex + TWO];
      const nextNextPrimitive = nextNextEdgeCommand ? primitives[nextNextEdgeCommand.primitiveIndex] : undefined;
      const shouldPreferCustomCompleteArc =
        nextEdgeCommand !== undefined &&
        primitives[nextEdgeCommand.primitiveIndex]?.kind === 'line' &&
        isSingleEdgePartialArc(nextNextEdgeCommand, primitives);
      const previousVertex = vertices[vertices.length - ONE];

      if (
        arcRunEdgeCommands.length === ONE &&
        isSingleEdgePartialArc(edgeCommand, primitives) &&
        nextEdgeCommand !== undefined &&
        primitives[nextEdgeCommand.primitiveIndex]?.kind === 'line' &&
        nextNextEdgeCommand !== undefined &&
        nextNextPrimitive?.kind === 'arc'
      ) {
        const anchorVertex = vertices[vertices.length - ONE];

        if (anchorVertex && primitive.kind === 'arc') {
          const anchoredVertex = getStartAnchoredArcVertex(anchorVertex, edgeCommand, primitive, nodes);

          if (anchoredVertex) {
            vertices[vertices.length - ONE] = anchoredVertex;
            const distributedVertex = getArcRunCustomVertex([nextNextEdgeCommand], primitives, nodes);

            if (distributedVertex) {
              addModelVertex(
                vertices,
                overrideCustomCornerArcEntry(
                  distributedVertex,
                  new Point(
                    anchoredVertex.customCornerArc?.exit.x ?? anchoredVertex.x,
                    anchoredVertex.customCornerArc?.exit.y ?? anchoredVertex.y,
                  ),
                ),
              );
              index = runEndIndex + TWO;
              continue;
            }
          }
        }
      } else if (arcRunEdgeCommands.length > ONE && hasDistinctArcRunSourceVertices(arcRunEdgeCommands, primitives)) {
        addSplitArcRunVertices(vertices, arcRunEdgeCommands, primitives, nodes);
      } else if (arcRunEdgeCommands.length > ONE) {
        if (customArcRunVertex) {
          addModelVertex(vertices, customArcRunVertex);
        }
      } else if (isCompleteSingleArcRun(arcRunEdgeCommands, primitives)) {
        const sourceHasStandardCornerRadius = (plainArcRunVertex?.cornerRadius ?? ZERO) > ZERO;

        if (
          previousVertex?.customCornerArc !== undefined &&
          customArcRunVertex?.customCornerArc !== undefined &&
          sourceHasStandardCornerRadius
        ) {
          addModelVertex(vertices, customArcRunVertex);
        } else if (shouldPreferCustomCompleteArc && customArcRunVertex?.customCornerArc !== undefined) {
          addModelVertex(vertices, customArcRunVertex);
        } else if (!sourceHasStandardCornerRadius && customArcRunVertex?.customCornerArc !== undefined) {
          addModelVertex(vertices, customArcRunVertex);
        } else if (plainArcRunVertex) {
          addModelVertex(vertices, plainArcRunVertex);
        }
      } else {
        const anchorVertex = vertices[vertices.length - ONE];

        if (anchorVertex) {
          const anchoredVertex = getStartAnchoredArcVertex(anchorVertex, edgeCommand, primitive, nodes);

          if (anchoredVertex) {
            vertices[vertices.length - ONE] = anchoredVertex;
          }
        }

        if (customArcRunVertex && hasMultipleArcPrimitives(arcRunEdgeCommands, primitives)) {
          addModelVertex(vertices, customArcRunVertex);
        } else {
          addModelVertex(vertices, getEdgeCommandEndVertex(edgeCommand, primitive, nodes));
        }
      }

      index = runEndIndex;
      continue;
    }

    addModelVertex(vertices, getEdgeCommandEndVertex(edgeCommand, primitive, nodes));
  }

  return collapseTechnicalArcExitVertices(
    removeArcEntryVertices(
      removePreviousArcExitVertices(
        removeRedundantStraightVertices(
          normalizeLeadingArcIntoNextRoundedCorner(normalizeClosingTechnicalArcVertex(compactModelVertices(vertices))),
        ),
      ),
    ),
  );
}

function getFacePath(
  faceKeys: string[],
  nodes: Map<string, SplitGraphNode>,
  edgeCommands: Map<string, SplitEdgeCommand>,
  primitives: Primitive[],
): Path | undefined {
  const firstNode = nodes.get(faceKeys[ZERO] ?? '');

  if (!firstNode) {
    return undefined;
  }

  const vertices = getFaceVertices(
    firstNode,
    mergeEdgeCommands(getFaceEdgeCommands(faceKeys, edgeCommands)),
    primitives,
    nodes,
  );
  const path = new Path(vertices);
  path.isPathClosed = true;

  return path;
}

function addFace(
  faceKeys: string[],
  nodes: Map<string, SplitGraphNode>,
  edgeCommands: Map<string, SplitEdgeCommand>,
  primitives: Primitive[],
  visitedFaceKeys: Set<string>,
  faces: Path[],
): void {
  if (!isValidFace(faceKeys, nodes)) {
    return;
  }

  const faceKey = getCanonicalFaceKey(faceKeys);

  if (visitedFaceKeys.has(faceKey)) {
    return;
  }

  const facePath = getFacePath(faceKeys, nodes, edgeCommands, primitives);

  if (facePath) {
    visitedFaceKeys.add(faceKey);
    faces.push(facePath);
  }
}

function getGraphFaces(
  nodes: Map<string, SplitGraphNode>,
  adjacency: Map<string, string[]>,
  edgeCommands: Map<string, SplitEdgeCommand>,
  primitives: Primitive[],
): Path[] {
  const visitedDirectedEdges = new Set<string>();
  const visitedFaceKeys = new Set<string>();
  const faces: Path[] = [];

  for (const [fromKey, neighborKeys] of adjacency) {
    for (const toKey of neighborKeys) {
      const [fromX, fromY] = fromKey.split(',').map(Number);
      const [toX, toY] = toKey.split(',').map(Number);

      if (fromX === undefined || fromY === undefined || toX === undefined || toY === undefined) {
        continue;
      }

      const startEdge = new DirectEdge(new Point(fromX, fromY), new Point(toX, toY));

      if (visitedDirectedEdges.has(startEdge.key)) {
        continue;
      }

      addFace(
        walkFace(startEdge, visitedDirectedEdges, adjacency),
        nodes,
        edgeCommands,
        primitives,
        visitedFaceKeys,
        faces,
      );
    }
  }

  return faces;
}

export function splitPathsIntoShapes(paths: Path[]): Path[] {
  console.log(paths.map((path) => getPathGeometriesUtil(path.commands)));

  const primitives = paths
    .flatMap((path) => parsePathPrimitives(path))
    .map((primitive, index) => ({ ...primitive, index }));
  const splitSegments = getSplitPrimitiveSegments(primitives);
  const nodes = new Map<string, SplitGraphNode>();
  const adjacency = new Map<string, string[]>();
  const edgeCommands = new Map<string, SplitEdgeCommand>();

  for (const segment of splitSegments) {
    addGraphEdge(nodes, adjacency, edgeCommands, segment);
  }

  sortGraphAdjacency(nodes, adjacency);

  return getGraphFaces(nodes, adjacency, edgeCommands, primitives);
}
