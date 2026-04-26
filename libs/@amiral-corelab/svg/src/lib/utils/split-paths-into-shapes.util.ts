/* eslint-disable max-lines */
import { Path } from '../classes/path';
import { Vertex } from '../classes/vertex';
import { CornerGeometry } from '../classes/corner-geometry';

const ZERO = 0;
const ONE = 1;
const TWO = 2;
const MINIMUM_FACE_VERTEX_COUNT = 3;
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
  readonly sourceVertex: Vertex | undefined;
}

type Primitive = ArcPrimitive | LinePrimitive;

interface Segment {
  readonly start: PointLike;
  readonly end: PointLike;
  readonly primitiveIndex: number;
  readonly tStart: number;
  readonly tEnd: number;
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
  return `${point.x},${point.y}`;
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

function isSamePoint(first: PointLike, second: PointLike): boolean {
  return isEqual(first.x, second.x) && isEqual(first.y, second.y);
}

function getGraphNodeKey(nodes: Map<string, GraphNode>, point: PointLike): string {
  for (const node of nodes.values()) {
    if (isSamePoint(node.point, point)) {
      return node.key;
    }
  }

  return getPointKey(point);
}

function getSegmentParameter(segment: Segment, point: PointLike): number {
  const direction = subtract(segment.end, segment.start);
  const pointDirection = subtract(point, segment.start);
  const lengthSquared = dot(direction, direction);

  return lengthSquared === ZERO ? ZERO : dot(pointDirection, direction) / lengthSquared;
}

function getSegmentIntersection(firstSegment: Segment, secondSegment: Segment): PointLike | undefined {
  const p = firstSegment.start;
  const q = secondSegment.start;
  const r = subtract(firstSegment.end, firstSegment.start);
  const s = subtract(secondSegment.end, secondSegment.start);
  const denominator = cross(r, s);
  const qMinusP = subtract(q, p);

  if (denominator === ZERO) {
    return undefined;
  }

  const firstT = cross(qMinusP, s) / denominator;
  const secondT = cross(qMinusP, r) / denominator;

  if (firstT < ZERO || firstT > ONE || secondT < ZERO || secondT > ONE) {
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
  const coefficient = sign * Math.sqrt(ratio);

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
  sourceVertex?: Vertex,
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
    sourceVertex,
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

function isPointOnEdge(point: PointLike, start: PointLike, end: PointLike): boolean {
  const edge = subtract(end, start);
  const pointDirection = subtract(point, start);
  const lengthSquared = dot(edge, edge);
  const t = lengthSquared === ZERO ? ZERO : dot(pointDirection, edge) / lengthSquared;

  return cross(edge, pointDirection) === ZERO && t >= ZERO && t <= ONE;
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
  sourceVertex: Vertex | undefined,
): PointLike {
  const arcPrimitive = createArcPrimitive(primitives.length, currentPoint, arcParameters, sourceVertex);
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

// eslint-disable-next-line max-lines-per-function
function parsePathPrimitives(path: Path): Primitive[] {
  const tokens = tokenizePathData(path.d);
  const primitives: Primitive[] = [];
  const arcSourceVertices = getArcSourceVertices(path);
  let index = ZERO;
  let arcSourceVertexIndex = ZERO;
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

      const sourceVertex = arcSourceVertices[arcSourceVertexIndex];
      arcSourceVertexIndex += ONE;
      currentPoint = addArcCommandPrimitive(primitives, currentPoint, arcParameters, sourceVertex);
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

function getSortedSplitPoints(splitPoints: SegmentSplitPoint[]): SegmentSplitPoint[] {
  return splitPoints
    .filter(({ t }) => t >= ZERO && t <= ONE)
    .sort((first, second) => first.t - second.t)
    .filter((splitPoint, index, sortedSplitPoints) => {
      const previousSplitPoint = sortedSplitPoints[index - ONE];

      return !previousSplitPoint || !isEqual(splitPoint.t, previousSplitPoint.t);
    });
}

function getPrimitiveBaseSegment(primitive: Primitive): Segment {
  return {
    start: primitive.start,
    end: primitive.end,
    primitiveIndex: primitive.index,
    tStart: ZERO,
    tEnd: ONE,
  };
}

function getArcPointParameter(arc: ArcPrimitive, point: PointLike): number {
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

    const point = {
      x: line.start.x + lineDeltaX * lineT,
      y: line.start.y + lineDeltaY * lineT,
    };
    const arcT = getArcPointParameter(arc, point);

    if (arcT < ZERO || arcT > ONE) {
      return [];
    }

    return [
      {
        lineSplitPoint: {
          point,
          t: lineT,
        },
        arcSplitPoint: {
          point,
          t: arcT,
        },
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
      splitPointMap.get(firstPrimitive.index)?.push({
        point: intersection,
        t: getSegmentParameter(getPrimitiveBaseSegment(firstPrimitive), intersection),
      });
      splitPointMap.get(secondPrimitive.index)?.push({
        point: intersection,
        t: getSegmentParameter(getPrimitiveBaseSegment(secondPrimitive), intersection),
      });
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
      [
        {
          point: primitive.start,
          t: ZERO,
        },
        {
          point: primitive.end,
          t: ONE,
        },
      ],
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

function getSplitPrimitiveSegments(primitives: Primitive[]): Segment[] {
  const splitPointMap = createPrimitiveSplitPointMap(primitives);
  const splitSegments: Segment[] = [];

  for (const primitive of primitives) {
    const splitPoints = getSortedSplitPoints(splitPointMap.get(primitive.index) ?? []);

    for (let index = ZERO; index < splitPoints.length - ONE; index += ONE) {
      const start = splitPoints[index];
      const end = splitPoints[index + ONE];

      if (!start || !end || isSamePoint(start.point, end.point)) {
        continue;
      }

      splitSegments.push({
        start: start.point,
        end: end.point,
        primitiveIndex: primitive.index,
        tStart: start.t,
        tEnd: end.t,
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
  const startKey = getGraphNodeKey(nodes, segment.start);
  const endKey = getGraphNodeKey(nodes, segment.end);
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

  return getFaceArea(points) > ZERO;
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
      isEqual(previousEdgeCommand.tEnd, edgeCommand.tStart)
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

function getArcSweepFlag(primitive: ArcPrimitive, fromT: number, toT: number): number {
  return primitive.deltaAngle * (toT - fromT) >= ZERO ? ONE : ZERO;
}

function getArcLargeArcFlag(primitive: ArcPrimitive, fromT: number, toT: number): number {
  return Math.abs(primitive.deltaAngle * (toT - fromT)) > Math.PI ? ONE : ZERO;
}

function getArcRunEndIndex(edgeCommands: EdgeCommand[], primitives: Primitive[], startIndex: number): number {
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

function getComputedArcEntry(vertex: Vertex, vertices: Vertex[], index: number): PointLike | undefined {
  if (vertex.customCornerArc !== undefined) {
    return {
      x: vertex.customCornerArc.entryX,
      y: vertex.customCornerArc.entryY,
    };
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

    return {
      x: vertex.x + geometry.incomingUnitVector.x * tangentOffset,
      y: vertex.y + geometry.incomingUnitVector.y * tangentOffset,
    };
  } catch {
    return undefined;
  }
}

function getEdgeCommandEndVertex(
  edgeCommand: EdgeCommand,
  primitive: Primitive,
  nodes: Map<string, GraphNode>,
): Vertex {
  const end = nodes.get(edgeCommand.toKey)?.point ?? getPrimitivePoint(primitive, edgeCommand.tEnd);

  return new Vertex(end.x, end.y);
}

function getArcRunSourceVertexSimpler(edgeCommands: EdgeCommand[], primitives: Primitive[]): Vertex | undefined {
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

  return (
    customCornerArc !== undefined &&
    isSamePoint(vertex, {
      x: customCornerArc.entryX,
      y: customCornerArc.entryY,
    })
  );
}

function shouldAbsorbPreviousArcExit(previousVertex: Vertex, vertex: Vertex, nextVertex: Vertex): boolean {
  return (
    isPlainVertex(vertex) &&
    previousVertex.customCornerArc !== undefined &&
    (
      isSamePoint(vertex, nextVertex) ||
      nextVertex.cornerRadius > ZERO ||
      nextVertex.customCornerArc !== undefined
    )
  );
}

function shouldMoveCurrentArcToNextVertex(previousVertex: Vertex | undefined, vertex: Vertex, nextVertex: Vertex): boolean {
  return (
    previousVertex?.customCornerArc !== undefined &&
    vertex.customCornerArc !== undefined &&
    isSamePoint(vertex, { x: vertex.customCornerArc.entryX, y: vertex.customCornerArc.entryY }) &&
    isPlainVertex(nextVertex) &&
    isSamePoint(nextVertex, { x: vertex.customCornerArc.exitX, y: vertex.customCornerArc.exitY })
  );
}

function compactModelVertices(vertices: Vertex[]): Vertex[] {
  const compactedVertices = vertices.reduce<Vertex[]>((compacted, vertex, index, sourceVertices) => {
    const previousVertex = compacted[compacted.length - ONE];
    const nextIndex = (index + ONE) % sourceVertices.length;
    const nextVertex = sourceVertices[nextIndex];

    if (previousVertex && isSamePoint(previousVertex, vertex)) {
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

  if (firstVertex && lastVertex && compactedVertices.length > ONE && isSamePoint(firstVertex, lastVertex)) {
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
    !isSamePoint(previousVertex, vertex) &&
    !isSamePoint(vertex, nextVertex)
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

    return nextEntryPoint === undefined || !isSamePoint(vertex, nextEntryPoint);
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
      (nextVertex?.cornerRadius ?? ZERO) > ZERO
    );
  });
}

function getArcRunCustomVertex(
  edgeCommands: EdgeCommand[],
  primitives: Primitive[],
  nodes: Map<string, GraphNode>,
): Vertex | undefined {
  const sourceVertex = getArcRunSourceVertexSimpler(edgeCommands, primitives);
  const firstEdgeCommand = edgeCommands[ZERO];
  const lastEdgeCommand = edgeCommands[edgeCommands.length - ONE];
  const lastPrimitive = lastEdgeCommand ? primitives[lastEdgeCommand.primitiveIndex] : undefined;

  if (
    !sourceVertex ||
    !firstEdgeCommand ||
    !lastEdgeCommand ||
    lastPrimitive?.kind !== 'arc'
  ) {
    return undefined;
  }

  const firstPrimitive = primitives[firstEdgeCommand.primitiveIndex];

  if (firstPrimitive?.kind !== 'arc') {
    return undefined;
  }

  const entry = getPrimitivePoint(firstPrimitive, firstEdgeCommand.tStart);
  const exit = nodes.get(lastEdgeCommand.toKey)?.point ?? getPrimitivePoint(lastPrimitive, lastEdgeCommand.tEnd);

  return cloneVertex(sourceVertex, {
    entryX: entry.x,
    entryY: entry.y,
    exitX: exit.x,
    exitY: exit.y,
    radiusX: lastPrimitive.radiusX,
    radiusY: lastPrimitive.radiusY,
    axisRotation: (lastPrimitive.axisRotation * DEGREES_IN_HALF_TURN) / HALF_TURN,
    largeArcFlag: getArcLargeArcFlag(lastPrimitive, lastEdgeCommand.tStart, lastEdgeCommand.tEnd),
    sweepFlag: getArcSweepFlag(lastPrimitive, lastEdgeCommand.tStart, lastEdgeCommand.tEnd),
  });
}

function getStartAnchoredArcVertex(
  vertex: Vertex,
  edgeCommand: EdgeCommand,
  primitive: ArcPrimitive,
  nodes: Map<string, GraphNode>,
): Vertex | undefined {
  if (edgeCommand.primitiveIndex !== primitive.index) {
    return undefined;
  }

  const exit = nodes.get(edgeCommand.toKey)?.point ?? getPrimitivePoint(primitive, edgeCommand.tEnd);

  return cloneVertex(new Vertex(vertex.x, vertex.y, vertex.cornerRadius), {
    entryX: vertex.x,
    entryY: vertex.y,
    exitX: exit.x,
    exitY: exit.y,
    radiusX: primitive.radiusX,
    radiusY: primitive.radiusY,
    axisRotation: (primitive.axisRotation * DEGREES_IN_HALF_TURN) / HALF_TURN,
    largeArcFlag: getArcLargeArcFlag(primitive, edgeCommand.tStart, edgeCommand.tEnd),
    sweepFlag: getArcSweepFlag(primitive, edgeCommand.tStart, edgeCommand.tEnd),
  });
}

function overrideCustomCornerArcEntry(vertex: Vertex, entryPoint: PointLike): Vertex {
  if (vertex.customCornerArc === undefined) {
    return vertex;
  }

  return cloneVertex(vertex, {
    ...vertex.customCornerArc,
    entryX: entryPoint.x,
    entryY: entryPoint.y,
  });
}

function getArcRunPlainVertex(edgeCommands: EdgeCommand[], primitives: Primitive[]): Vertex | undefined {
  const sourceVertex = getArcRunSourceVertexSimpler(edgeCommands, primitives);

  return sourceVertex === undefined ? undefined : clonePlainVertex(sourceVertex);
}

function hasMultipleArcPrimitives(edgeCommands: EdgeCommand[], primitives: Primitive[]): boolean {
  const primitiveIndexes = new Set<number>();

  for (const edgeCommand of edgeCommands) {
    const primitive = primitives[edgeCommand.primitiveIndex];

    if (primitive?.kind === 'arc') {
      primitiveIndexes.add(edgeCommand.primitiveIndex);
    }
  }

  return primitiveIndexes.size > ONE;
}

function isCompleteSingleArcRun(edgeCommands: EdgeCommand[], primitives: Primitive[]): boolean {
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

function isSingleEdgePartialArc(edgeCommand: EdgeCommand | undefined, primitives: Primitive[]): boolean {
  if (!edgeCommand) {
    return false;
  }

  const primitive = primitives[edgeCommand.primitiveIndex];

  return primitive?.kind === 'arc' && (!isEqual(edgeCommand.tStart, ZERO) || !isEqual(edgeCommand.tEnd, ONE));
}

function getArcRunSourceVertices(edgeCommands: EdgeCommand[], primitives: Primitive[]): Vertex[] {
  return edgeCommands.flatMap((edgeCommand) => {
    const primitive = primitives[edgeCommand.primitiveIndex];

    return primitive?.kind === 'arc' && primitive.sourceVertex !== undefined ? [primitive.sourceVertex] : [];
  });
}

function hasDistinctArcRunSourceVertices(edgeCommands: EdgeCommand[], primitives: Primitive[]): boolean {
  const sourceVertices = getArcRunSourceVertices(edgeCommands, primitives);

  return new Set(sourceVertices.map((vertex) => getPointKey(vertex))).size > ONE;
}

function addSplitArcRunVertices(
  vertices: Vertex[],
  edgeCommands: EdgeCommand[],
  primitives: Primitive[],
  nodes: Map<string, GraphNode>,
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
  firstNode: GraphNode,
  edgeCommands: EdgeCommand[],
  primitives: Primitive[],
  nodes: Map<string, GraphNode>,
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
                overrideCustomCornerArcEntry(distributedVertex, {
                  x: anchoredVertex.customCornerArc?.exitX ?? anchoredVertex.x,
                  y: anchoredVertex.customCornerArc?.exitY ?? anchoredVertex.y,
                }),
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
        if (
          previousVertex?.customCornerArc !== undefined &&
          customArcRunVertex?.customCornerArc !== undefined &&
          customArcRunVertex.cornerRadius > ZERO
        ) {
          addModelVertex(vertices, customArcRunVertex);
        } else if (shouldPreferCustomCompleteArc && customArcRunVertex?.customCornerArc !== undefined) {
          addModelVertex(vertices, customArcRunVertex);
        } else if (customArcRunVertex?.customCornerArc !== undefined && customArcRunVertex.cornerRadius === ZERO) {
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
    removeArcEntryVertices(removePreviousArcExitVertices(removeRedundantStraightVertices(compactModelVertices(vertices)))),
  );
}

function getFacePath(
  faceKeys: string[],
  nodes: Map<string, GraphNode>,
  edgeCommands: Map<string, EdgeCommand>,
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
  const splitSegments = getSplitPrimitiveSegments(primitives);
  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, string[]>();
  const edgeCommands = new Map<string, EdgeCommand>();

  for (const segment of splitSegments) {
    addGraphEdge(nodes, adjacency, edgeCommands, segment);
  }

  sortGraphAdjacency(nodes, adjacency);

  return getGraphFaces(nodes, adjacency, edgeCommands, primitives);
}
