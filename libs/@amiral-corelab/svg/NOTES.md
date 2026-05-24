# SVG Geometry Notes

## Goal

Build a maintainable SVG geometry model for creating paths, rounded corners, intersections,
splitting primitives, and later extracting closed faces from one or more paths.

The current focus is the geometry layer in:

```txt
libs/@amiral-corelab/svg/src/lib
```

## Main Model

### Geometry Objects

- `Point`
  - Position in the SVG user coordinate system.
  - Has `x`, `y`, `moveAlongVector()`, `getVectorTo()`.

- `Vector`
  - Direction/offset, not a position.
  - Has length, dot product, signed/unsigned angle, normalize, `fromPoints()`.

- `PathPrimitiveSegment`
  - Finite straight line between two `Point`s.
  - Represents drawable straight geometry, not a logical vertex connection.

- `BoundingBox`
  - Axis-aligned box with `minX`, `minY`, `maxX`, `maxY`, `width`, `height`.
  - Has `intersects()`, `fromMinMax()`, `fromPoints()`.
  - Used for broad-phase intersection filtering.

### Path Objects

- `Vertex extends Point`
  - Logical path vertex.
  - Optional `cornerDefinition`.

- `Path`
  - Stores ordered `vertices` and `closed`.
  - Converts vertices to `PathPrimitive[]`.
  - Converts primitives to commands via `PathCommandFactory`.
  - Can serialize to SVG path data with `toD()`.

- `PathEdge`
  - Logical directed edge between vertices.
  - Not the final drawable `PathPrimitiveSegment`, because rounded corners may shorten edges.

### Corner Definitions

- `CornerDefinition`
  - Abstract base class.

- `CornerDefinitionRadius`
  - Radius intent at a vertex.
  - Needs previous/current/next vertices to resolve geometry.

- `CornerDefinitionRadiusGeometry`
  - Computed radius corner geometry.
  - Stores previous/current/next points, vectors, unit vectors, corner angle, tangent offset,
    entry/exit points.
  - Converts to `PathPrimitiveArcCenter`.

- `CornerDefinitionBezier`
  - Editable relative Bezier handles attached to a vertex.
  - Handle vectors can later be resolved into Bezier path primitives.

- `PathPrimitiveArcCenter`
  - Drawable center-parameterized arc primitive.
  - Stores `center`, `radiusX`, `radiusY`, `axisRotation`, `startAngle`, `deltaAngle`.
  - Angles are in radians.
  - Has `getPointAtAngle()`, `start`, and `end`.

## Path Primitives And Commands

`PathPrimitive` is currently:

```ts
abstract class PathPrimitive {
  readonly start: Point;
  readonly end: Point;
}
```

Decision: `Point` is not a `PathPrimitive`. `Move` is generated from the start point of the
first primitive.

SVG commands:

- `PathCommandMove`
- `PathCommandLine`
- `PathCommandArc`
- `PathCommandClose`

`PathCommandFactory` handles:

- primitive -> SVG command
- start/end point of a primitive
- radians -> degrees for SVG arc command axis rotation
- SVG `largeArcFlag` and `sweepFlag`

## Services

### AngleService

Helpers:

- `radiansToDegrees()`
- `degreesToRadians()`
- `normalizeRadians()`
- `normalizeDegrees()`

### ArcCenterService

Arc-centered geometry helpers:

- `getPointInLocalCoordinates()`
- `getPointEllipseValue()`
- `getPointAngleOnArc()`
- `isAngleOnArc()`
- `getAngleParameterOnArc()`
- `getArcExtremumAngles()`

### PathPrimitiveBoundingBoxService

Computes bounding boxes for:

- `PathPrimitiveSegment`
- `PathPrimitiveArcCenter`

Arc boxes use endpoints plus x/y ellipse extrema that lie on the arc sweep.

### PathPrimitivePairService

Broad phase for intersections:

1. Compute bounding box for every primitive.
2. Compare boxes.
3. Return unique `PathPrimitivePair`s whose boxes overlap.

This avoids exact primitive intersection checks for impossible pairs.

### PathPrimitiveIntersectionService

Exact intersections for:

- segment/segment
- segment/arc
- arc/arc

Important details:

- `GeometryToleranceService` derives distance, parameter, and implicit-equation tolerances
  from primitive bounding-box scale, with conservative minimum tolerances for tiny geometry.
- Results are not rounded or snapped.
- `SegmentSegmentIntersectionService` uses the standard equation `p + t*r = q + u*s` and
  returns overlap boundary points for collinear overlapping segments.
- `SegmentArcIntersectionService` solves line/ellipse in the arc local coordinate system.
- `ArcArcIntersectionService` substitutes arc A's center-parametric ellipse into arc B's
  implicit ellipse equation, converts the resulting trigonometric quadratic to a quartic with
  `tan(angle / 2)`, isolates real roots, and returns overlap boundary points for same-ellipse
  arcs.

Public methods:

- `getIntersections(primitiveA, primitiveB)`
- `getAllIntersections(primitivesWithOrigin)`
- `getSplitIntersections(primitivesWithOrigin)`
- `getSplitIntersectionPoints(primitivesWithOrigin)`

`getSplitIntersections()` requires `PathPrimitiveWithOrigin[]`. It filters endpoint/endpoint
contacts only when the origins show adjacent primitives in the same source path.

## Known Design Decisions

- Keep classes instead of interfaces when runtime checks are useful (`instanceof`).
- Keep geometry objects separate from SVG command objects.
- Keep SVG-specific command conversion in factories, not geometry classes.
- Keep `largeArcFlag` / `sweepFlag` outside `PathPrimitiveArcCenter`; they are SVG endpoint command concepts.
- Use `PathPrimitiveArcCenter` as the calculated arc primitive representation.
- Use bounding boxes before exact intersections.
- Use floating point math with explicit comparison tolerance where needed. Do not round/snap returned values silently.

## Important Refs

- SVG paths: https://www.w3.org/TR/SVG2/paths.html
- SVG path data: https://www.w3.org/TR/SVG2/paths.html#PathData
- SVG arc command: https://www.w3.org/TR/SVG2/paths.html#PathDataEllipticalArcCommands
- SVG coordinate systems: https://www.w3.org/TR/SVG2/coords.html
- SVG arc implementation notes: https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
- SVG getBBox API reference: https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox

## Current Verification Command

```bash
npx tsc -p libs/@amiral-corelab/svg/tsconfig.lib.json --noEmit
```
