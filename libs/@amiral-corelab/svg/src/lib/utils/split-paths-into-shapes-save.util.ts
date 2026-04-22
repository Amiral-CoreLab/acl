/* eslint-disable max-lines */
import { Path } from '../classes/path';
import { Vertex } from '../classes/vertex';

const EPSILON = 1e-9;
const POINT_KEY_PRECISION = 1e9;
const ZERO = 0;
const ONE = 1;
const TWO = 2;
const MINIMUM_FACE_VERTEX_COUNT = 3;
const ARC_SAMPLE_COUNT = 32;
const SVG_ARC_TOKEN_COUNT = 7;
const DEGREES_IN_HALF_TURN = 180;
const HALF_TURN = Math.PI;
const FULL_TURN = Math.PI * TWO;

interface PointLike {
  readonly x: number;
  readonly y: number;
}

interface BasePrimitive {
  readonly index: number;
  readonly start: PointLike;
  readonly end: PointLike;
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
}

type Primitive = ArcPrimitive | LinePrimitive;

interface Segment {
  readonly start: PointLike;
  readonly end: PointLike;
  readonly primitiveIndex: number;
  readonly tStart: number;
  readonly tEnd: number;
}

interface IndexedSegment extends Segment {
  readonly index: number;
}

interface SegmentSplitPoint {
  readonly point: PointLike;
  readonly t: number;
}

interface GraphNode {
  readonly key: string;
  readonly point: PointLike;
}

interface DirectedEdge {
  readonly fromKey: string;
  readonly toKey: string;
}

interface EdgeCommand {
  readonly fromKey: string;
  readonly toKey: string;
  readonly primitiveIndex: number;
  readonly tStart: number;
  readonly tEnd: number;
}

interface ArcEndpointParameters {
  readonly radiusX: number;
  readonly radiusY: number;
  readonly axisRotation: number;
  readonly largeArcFlag: number;
  readonly sweepFlag: number;
  readonly endX: number;
  readonly endY: number;
}

interface NormalizedArc extends PointLike {
  readonly radiusX: number;
  readonly radiusY: number;
}

class SplitShapePath extends Path {
  private readonly pathData: string;

  public constructor(vertices: Vertex[], pathData: string) {
    super(vertices);
    this.isPathClosed = true;
    this.pathData = pathData;
  }

  public override get d(): string {
    return this.pathData;
  }
}

function subtract(first: PointLike, second: PointLike): PointLike {
  return {
    x: first.x - second.x,
    y: first.y - second.y,
  };
}

function cross(first: PointLike, second: PointLike): number {
  return first.x * second.y - first.y * second.x;
}

function dot(first: PointLike, second: PointLike): number {
  return first.x * second.x + first.y * second.y;
}

function getPointAt(segment: Segment, t: number): PointLike {
  return {
    x: segment.start.x + (segment.end.x - segment.start.x) * t,
    y: segment.start.y + (segment.end.y - segment.start.y) * t,
  };
}

function getPointKey(point: PointLike): string {
  return `${Math.round(point.x * POINT_KEY_PRECISION)},${Math.round(point.y * POINT_KEY_PRECISION)}`;
}

function getDirectedEdgeKey(edge: DirectedEdge): string {
  return `${edge.fromKey}->${edge.toKey}`;
}

function getUndirectedEdgeKey(firstKey: string, secondKey: string): string {
  return firstKey < secondKey ? `${firstKey}|${secondKey}` : `${secondKey}|${firstKey}`;
}

function isNearlyEqual(first: number, second: number): boolean {
  return Math.abs(first - second) <= EPSILON;
}

function isSamePoint(first: PointLike, second: PointLike): boolean {
  return isNearlyEqual(first.x, second.x) && isNearlyEqual(first.y, second.y);
}

function getSegmentParameter(segment: Segment, point: PointLike): number {
  const direction = subtract(segment.end, segment.start);
  const pointDirection = subtract(point, segment.start);
  const lengthSquared = dot(direction, direction);

  return lengthSquared === ZERO ? ZERO : dot(pointDirection, direction) / lengthSquared;
}

function isPointOnSegment(segment: Segment, point: PointLike): boolean {
  const direction = subtract(segment.end, segment.start);
  const pointDirection = subtract(point, segment.start);
  const t = getSegmentParameter(segment, point);

  return Math.abs(cross(direction, pointDirection)) <= EPSILON && t >= -EPSILON && t <= ONE + EPSILON;
}

function getSegmentIntersection(firstSegment: Segment, secondSegment: Segment): PointLike | undefined {
  const p = firstSegment.start;
  const q = secondSegment.start;
  const r = subtract(firstSegment.end, firstSegment.start);
  const s = subtract(secondSegment.end, secondSegment.start);
  const denominator = cross(r, s);
  const qMinusP = subtract(q, p);

  if (Math.abs(denominator) <= EPSILON) {
    return undefined;
  }

  const firstT = cross(qMinusP, s) / denominator;
  const secondT = cross(qMinusP, r) / denominator;

  if (firstT < -EPSILON || firstT > ONE + EPSILON || secondT < -EPSILON || secondT > ONE + EPSILON) {
    return undefined;
  }

  return getPointAt(firstSegment, firstT);
}

function tokenizePathData(d: string): string[] {
  return d.match(/[AaLlMmZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gu) ?? [];
}

function isPathCommand(token: string | undefined): boolean {
  return token !== undefined && /^[AaLlMmZz]$/u.test(token);
}

function readNumber(tokens: string[], index: number): number | undefined {
  const token = tokens[index];

  return token === undefined || isPathCommand(token) ? undefined : Number(token);
}

function getVectorAngle(from: PointLike, to: PointLike): number {
  return Math.atan2(cross(from, to), dot(from, to));
}

function normalizeArcRadii(
  start: PointLike,
  end: PointLike,
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

function getArcDeltaAngle(sweepFlag: number, startVector: PointLike, endVector: PointLike): number {
  let deltaAngle = getVectorAngle(startVector, endVector);

  if (sweepFlag === ZERO && deltaAngle > ZERO) {
    deltaAngle -= FULL_TURN;
  } else if (sweepFlag === ONE && deltaAngle < ZERO) {
    deltaAngle += FULL_TURN;
  }

  return deltaAngle;
}

function getArcCenterPrime(normalizedArc: NormalizedArc, parameters: ArcEndpointParameters, ratio: number): PointLike {
  const sign = parameters.largeArcFlag === parameters.sweepFlag ? -ONE : ONE;
  const coefficient = sign * Math.sqrt(Math.max(ZERO, ratio));

  return {
    x: (coefficient * normalizedArc.radiusX * normalizedArc.y) / normalizedArc.radiusY,
    y: (-coefficient * normalizedArc.radiusY * normalizedArc.x) / normalizedArc.radiusX,
  };
}

function getArcCenter(
  start: PointLike,
  end: PointLike,
  centerPrime: PointLike,
  cosRotation: number,
  sinRotation: number,
): PointLike {
  return {
    x: cosRotation * centerPrime.x - sinRotation * centerPrime.y + (start.x + end.x) / TWO,
    y: sinRotation * centerPrime.x + cosRotation * centerPrime.y + (start.y + end.y) / TWO,
  };
}

function getArcVectors(
  normalizedArc: NormalizedArc,
  centerPrime: PointLike,
): { endVector: PointLike; startVector: PointLike } {
  return {
    startVector: {
      x: (normalizedArc.x - centerPrime.x) / normalizedArc.radiusX,
      y: (normalizedArc.y - centerPrime.y) / normalizedArc.radiusY,
    },
    endVector: {
      x: (-normalizedArc.x - centerPrime.x) / normalizedArc.radiusX,
      y: (-normalizedArc.y - centerPrime.y) / normalizedArc.radiusY,
    },
  };
}

function createArcPrimitive(
  index: number,
  start: PointLike,
  parameters: ArcEndpointParameters,
): ArcPrimitive | undefined {
  if (parameters.radiusX === ZERO || parameters.radiusY === ZERO) {
    return undefined;
  }

  const end = {
    x: parameters.endX,
    y: parameters.endY,
  };
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
    startAngle: getVectorAngle({ x: ONE, y: ZERO }, startVector),
    deltaAngle: getArcDeltaAngle(parameters.sweepFlag, startVector, endVector),
  };
}

function getPrimitivePoint(primitive: Primitive, t: number): PointLike {
  if (primitive.kind === 'line') {
    return {
      x: primitive.start.x + (primitive.end.x - primitive.start.x) * t,
      y: primitive.start.y + (primitive.end.y - primitive.start.y) * t,
    };
  }

  const angle = primitive.startAngle + primitive.deltaAngle * t;
  const cosRotation = Math.cos(primitive.axisRotation);
  const sinRotation = Math.sin(primitive.axisRotation);
  const x = primitive.radiusX * Math.cos(angle);
  const y = primitive.radiusY * Math.sin(angle);

  return {
    x: primitive.centerX + cosRotation * x - sinRotation * y,
    y: primitive.centerY + sinRotation * x + cosRotation * y,
  };
}

function readArcEndpointParameters(tokens: string[], index: number): ArcEndpointParameters | undefined {
  const values = Array.from({ length: SVG_ARC_TOKEN_COUNT }, (_, offset) => readNumber(tokens, index + offset));

  if (values.some((value) => value === undefined)) {
    return undefined;
  }

  const [radiusX, radiusY, axisRotation, largeArcFlag, sweepFlag, endX, endY] = values;

  if (
    radiusX === undefined ||
    radiusY === undefined ||
    axisRotation === undefined ||
    largeArcFlag === undefined ||
    sweepFlag === undefined ||
    endX === undefined ||
    endY === undefined
  ) {
    return undefined;
  }

  return {
    radiusX,
    radiusY,
    axisRotation,
    largeArcFlag,
    sweepFlag,
    endX,
    endY,
  };
}

function addLinePrimitive(primitives: Primitive[], start: PointLike, end: PointLike): void {
  if (isSamePoint(start, end)) {
    return;
  }

  primitives.push({
    kind: 'line',
    index: primitives.length,
    start,
    end,
  });
}

function readPoint(tokens: string[], index: number): PointLike | undefined {
  const x = readNumber(tokens, index);
  const y = readNumber(tokens, index + ONE);

  return x === undefined || y === undefined ? undefined : { x, y };
}

function addPointCommandPrimitive(
  primitives: Primitive[],
  command: string,
  currentPoint: PointLike | undefined,
  nextPoint: PointLike,
): void {
  if (command === 'L' && currentPoint) {
    addLinePrimitive(primitives, currentPoint, nextPoint);
  }
}

function addArcCommandPrimitive(
  primitives: Primitive[],
  currentPoint: PointLike,
  arcParameters: ArcEndpointParameters,
): PointLike {
  const arcPrimitive = createArcPrimitive(primitives.length, currentPoint, arcParameters);
  const nextPoint = {
    x: arcParameters.endX,
    y: arcParameters.endY,
  };

  if (arcPrimitive) {
    primitives.push(arcPrimitive);
  } else {
    addLinePrimitive(primitives, currentPoint, nextPoint);
  }

  return nextPoint;
}

// eslint-disable-next-line max-lines-per-function
function parsePathPrimitives(path: Path): Primitive[] {
  const tokens = tokenizePathData(path.d);
  const primitives: Primitive[] = [];
  let index = ZERO;
  let command = '';
  let currentPoint: PointLike | undefined;
  let subpathStart: PointLike | undefined;

  while (index < tokens.length) {
    if (isPathCommand(tokens[index])) {
      command = tokens[index] ?? '';
      index += ONE;
    }

    if (command === 'M' || command === 'L') {
      const nextPoint = readPoint(tokens, index);

      if (nextPoint === undefined) {
        break;
      }

      addPointCommandPrimitive(primitives, command, currentPoint, nextPoint);

      if (command === 'M') {
        subpathStart = nextPoint;
      }

      currentPoint = nextPoint;
      index += TWO;
      continue;
    }

    if (command === 'A' && currentPoint) {
      const arcParameters = readArcEndpointParameters(tokens, index);

      if (!arcParameters) {
        break;
      }

      currentPoint = addArcCommandPrimitive(primitives, currentPoint, arcParameters);
      index += SVG_ARC_TOKEN_COUNT;
      continue;
    }

    if (command === 'Z' && currentPoint && subpathStart) {
      addLinePrimitive(primitives, currentPoint, subpathStart);
      currentPoint = subpathStart;
      index += ONE;
      continue;
    }

    index += ONE;
  }

  return primitives;
}

function getPrimitiveSegments(primitive: Primitive): Segment[] {
  if (primitive.kind === 'line') {
    return [
      {
        start: primitive.start,
        end: primitive.end,
        primitiveIndex: primitive.index,
        tStart: ZERO,
        tEnd: ONE,
      },
    ];
  }

  return Array.from({ length: ARC_SAMPLE_COUNT }, (_, index) => {
    const tStart = index / ARC_SAMPLE_COUNT;
    const tEnd = (index + ONE) / ARC_SAMPLE_COUNT;

    return {
      start: getPrimitivePoint(primitive, tStart),
      end: getPrimitivePoint(primitive, tEnd),
      primitiveIndex: primitive.index,
      tStart,
      tEnd,
    };
  });
}

function getSegmentSplitPoints(segment: IndexedSegment, segments: IndexedSegment[]): SegmentSplitPoint[] {
  const splitPoints: SegmentSplitPoint[] = [
    {
      point: segment.start,
      t: ZERO,
    },
    {
      point: segment.end,
      t: ONE,
    },
  ];

  for (const otherSegment of segments) {
    if (otherSegment.index === segment.index) {
      continue;
    }

    const intersection = getSegmentIntersection(segment, otherSegment);

    if (intersection) {
      splitPoints.push({
        point: intersection,
        t: getSegmentParameter(segment, intersection),
      });
      continue;
    }

    for (const point of [otherSegment.start, otherSegment.end]) {
      if (isPointOnSegment(segment, point)) {
        splitPoints.push({
          point,
          t: getSegmentParameter(segment, point),
        });
      }
    }
  }

  return splitPoints
    .filter(({ t }) => t >= -EPSILON && t <= ONE + EPSILON)
    .sort((first, second) => first.t - second.t)
    .filter((splitPoint, index, sortedSplitPoints) => {
      const previousSplitPoint = sortedSplitPoints[index - ONE];

      return !previousSplitPoint || !isNearlyEqual(splitPoint.t, previousSplitPoint.t);
    });
}

function getSplitSegments(segments: IndexedSegment[]): Segment[] {
  const splitSegments: Segment[] = [];

  for (const segment of segments) {
    const splitPoints = getSegmentSplitPoints(segment, segments);

    for (let index = ZERO; index < splitPoints.length - ONE; index += ONE) {
      const start = splitPoints[index];
      const end = splitPoints[index + ONE];

      if (!start || !end || getPointKey(start.point) === getPointKey(end.point)) {
        continue;
      }

      splitSegments.push({
        start: start.point,
        end: end.point,
        primitiveIndex: segment.primitiveIndex,
        tStart: segment.tStart + (segment.tEnd - segment.tStart) * start.t,
        tEnd: segment.tStart + (segment.tEnd - segment.tStart) * end.t,
      });
    }
  }

  return splitSegments;
}

function addGraphEdge(
  nodes: Map<string, GraphNode>,
  adjacency: Map<string, string[]>,
  edgeCommands: Map<string, EdgeCommand>,
  segment: Segment,
): void {
  const startKey = getPointKey(segment.start);
  const endKey = getPointKey(segment.end);
  const edgeKey = getUndirectedEdgeKey(startKey, endKey);

  if (startKey === endKey || edgeCommands.has(edgeKey)) {
    return;
  }

  nodes.set(startKey, {
    key: startKey,
    point: segment.start,
  });
  nodes.set(endKey, {
    key: endKey,
    point: segment.end,
  });
  edgeCommands.set(edgeKey, {
    fromKey: startKey,
    toKey: endKey,
    primitiveIndex: segment.primitiveIndex,
    tStart: segment.tStart,
    tEnd: segment.tEnd,
  });

  adjacency.set(startKey, [...(adjacency.get(startKey) ?? []), endKey]);
  adjacency.set(endKey, [...(adjacency.get(endKey) ?? []), startKey]);
}

function sortGraphAdjacency(nodes: Map<string, GraphNode>, adjacency: Map<string, string[]>): void {
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

function getFaceArea(points: PointLike[]): number {
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
  startEdge: DirectedEdge,
  visitedDirectedEdges: Set<string>,
  adjacency: Map<string, string[]>,
): string[] {
  const faceKeys: string[] = [];
  let currentFromKey = startEdge.fromKey;
  let currentToKey = startEdge.toKey;

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

function isValidFace(faceKeys: string[], nodes: Map<string, GraphNode>): boolean {
  if (faceKeys.length < MINIMUM_FACE_VERTEX_COUNT) {
    return false;
  }

  const points = faceKeys.flatMap((key) => {
    const node = nodes.get(key);

    return node ? [node.point] : [];
  });

  return getFaceArea(points) > EPSILON;
}

function getEdgeCommand(
  edgeCommands: Map<string, EdgeCommand>,
  fromKey: string,
  toKey: string,
): EdgeCommand | undefined {
  const edgeCommand = edgeCommands.get(getUndirectedEdgeKey(fromKey, toKey));

  if (!edgeCommand) {
    return undefined;
  }

  if (edgeCommand.fromKey === fromKey && edgeCommand.toKey === toKey) {
    return edgeCommand;
  }

  return {
    ...edgeCommand,
    fromKey,
    toKey,
    tStart: edgeCommand.tEnd,
    tEnd: edgeCommand.tStart,
  };
}

function getFaceEdgeCommands(faceKeys: string[], edgeCommands: Map<string, EdgeCommand>): EdgeCommand[] {
  return faceKeys.flatMap((fromKey, index) => {
    const toKey = faceKeys[(index + ONE) % faceKeys.length];
    const edgeCommand = toKey === undefined ? undefined : getEdgeCommand(edgeCommands, fromKey, toKey);

    return edgeCommand ? [edgeCommand] : [];
  });
}

function mergeEdgeCommands(edgeCommands: EdgeCommand[]): EdgeCommand[] {
  return edgeCommands.reduce<EdgeCommand[]>((mergedEdgeCommands, edgeCommand) => {
    const previousEdgeCommand = mergedEdgeCommands[mergedEdgeCommands.length - ONE];

    if (
      previousEdgeCommand?.primitiveIndex === edgeCommand.primitiveIndex &&
      isNearlyEqual(previousEdgeCommand.tEnd, edgeCommand.tStart)
    ) {
      mergedEdgeCommands[mergedEdgeCommands.length - ONE] = {
        ...previousEdgeCommand,
        toKey: edgeCommand.toKey,
        tEnd: edgeCommand.tEnd,
      };

      return mergedEdgeCommands;
    }

    mergedEdgeCommands.push(edgeCommand);

    return mergedEdgeCommands;
  }, []);
}

function getArcCommand(primitive: ArcPrimitive, fromT: number, toT: number): string {
  const end = getPrimitivePoint(primitive, toT);
  const deltaAngle = primitive.deltaAngle * (toT - fromT);
  const largeArcFlag = Math.abs(deltaAngle) > Math.PI ? ONE : ZERO;
  const sweepFlag = deltaAngle >= ZERO ? ONE : ZERO;
  const axisRotation = (primitive.axisRotation * DEGREES_IN_HALF_TURN) / HALF_TURN;

  return `A${primitive.radiusX} ${primitive.radiusY} ${axisRotation} ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function getEdgePathCommand(edgeCommand: EdgeCommand, primitives: Primitive[]): string | undefined {
  const primitive = primitives[edgeCommand.primitiveIndex];

  if (!primitive) {
    return undefined;
  }

  if (primitive.kind === 'line') {
    const end = getPrimitivePoint(primitive, edgeCommand.tEnd);

    return `L${end.x} ${end.y}`;
  }

  return getArcCommand(primitive, edgeCommand.tStart, edgeCommand.tEnd);
}

function getFacePathData(
  faceKeys: string[],
  nodes: Map<string, GraphNode>,
  edgeCommands: Map<string, EdgeCommand>,
  primitives: Primitive[],
): string | undefined {
  const firstNode = nodes.get(faceKeys[ZERO] ?? '');

  if (!firstNode) {
    return undefined;
  }

  const commands = mergeEdgeCommands(getFaceEdgeCommands(faceKeys, edgeCommands)).flatMap((edgeCommand) => {
    const command = getEdgePathCommand(edgeCommand, primitives);

    return command === undefined ? [] : [command];
  });

  return [`M${firstNode.point.x} ${firstNode.point.y}`, ...commands, 'Z'].join(' ');
}

function getFacePath(
  faceKeys: string[],
  nodes: Map<string, GraphNode>,
  edgeCommands: Map<string, EdgeCommand>,
  primitives: Primitive[],
): Path | undefined {
  const pathData = getFacePathData(faceKeys, nodes, edgeCommands, primitives);

  if (pathData === undefined) {
    return undefined;
  }

  const vertices = faceKeys.flatMap((key) => {
    const node = nodes.get(key);

    return node ? [new Vertex(node.point.x, node.point.y)] : [];
  });

  return new SplitShapePath(vertices, pathData);
}

function addFace(
  faceKeys: string[],
  nodes: Map<string, GraphNode>,
  edgeCommands: Map<string, EdgeCommand>,
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
  nodes: Map<string, GraphNode>,
  adjacency: Map<string, string[]>,
  edgeCommands: Map<string, EdgeCommand>,
  primitives: Primitive[],
): Path[] {
  const visitedDirectedEdges = new Set<string>();
  const visitedFaceKeys = new Set<string>();
  const faces: Path[] = [];

  for (const [fromKey, neighborKeys] of adjacency) {
    for (const toKey of neighborKeys) {
      const startEdge = { fromKey, toKey };

      if (visitedDirectedEdges.has(getDirectedEdgeKey(startEdge))) {
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
  const primitives = paths
    .flatMap((path) => parsePathPrimitives(path))
    .map((primitive, index) => ({ ...primitive, index }));
  const sampledSegments = primitives
    .flatMap((primitive) => getPrimitiveSegments(primitive))
    .map((segment, index) => ({ ...segment, index }));
  const splitSegments = getSplitSegments(sampledSegments);
  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, string[]>();
  const edgeCommands = new Map<string, EdgeCommand>();

  for (const segment of splitSegments) {
    addGraphEdge(nodes, adjacency, edgeCommands, segment);
  }

  sortGraphAdjacency(nodes, adjacency);

  return getGraphFaces(nodes, adjacency, edgeCommands, primitives);
}
