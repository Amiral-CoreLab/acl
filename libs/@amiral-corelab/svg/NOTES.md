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

- `Segment`
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
  - Converts primitives to commands via `PathPrimitiveCommandService`.
  - Can serialize to SVG path data with `toD()`.

- `PathEdge`
  - Logical directed edge between vertices.
  - Not the final drawable `Segment`, because rounded corners may shorten edges.

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
  - Converts to `CornerDefinitionArcCenter`.

- `CornerDefinitionArc`
  - Base for explicit arc definitions.

- `CornerDefinitionArcCenter`
  - Center-parameterized arc.
  - Stores `center`, `radiusX`, `radiusY`, `axisRotation`, `startAngle`, `deltaAngle`.
  - Angles are in radians.
  - Has `getPointAtAngle()`, `getStart()`, `getEnd()`.

- `CornerDefinitionArcSvg`
  - SVG endpoint arc definition.
  - Its `axisRotation` matches SVG `A` command and is in degrees.

- `CornerDefinitionArcThreePoint`
  - Arc through entry/middle/exit.

- `CornerDefinitionArcBulge`
  - Arc from entry/exit plus bulge value.

## Path Primitives And Commands

`PathPrimitive` is currently:

```ts
Segment | CornerDefinitionArcCenter;
```

Decision: `Point` is not a `PathPrimitive`. `Move` is generated from the start point of the
first primitive.

SVG commands:

- `PathCommandMove`
- `PathCommandLine`
- `PathCommandArc`
- `PathCommandClose`

`PathPrimitiveCommandService` handles:

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

### ArcCenterGeometryService

Arc-centered geometry helpers:

- `getPointInLocalCoordinates()`
- `getPointEllipseValue()`
- `getPointAngleOnArc()`
- `isAngleOnArc()`
- `getAngleParameterOnArc()`
- `getArcExtremumAngles()`

### PathPrimitiveBoundingBoxService

Computes bounding boxes for:

- `Segment`
- `CornerDefinitionArcCenter`

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

- `epsilon = 1e-9` is used only in comparison predicates.
- Results are not rounded or snapped.
- `SegmentSegmentIntersectionService` uses the standard equation `p + t*r = q + u*s`.
- `SegmentArcIntersectionService` solves line/ellipse in the arc local coordinate system.
- `ArcArcIntersectionService` substitutes arc A's center-parametric ellipse into arc B's
  implicit ellipse equation, converts the resulting trigonometric quadratic to a quartic with
  `tan(angle / 2)`, isolates real roots, and returns overlap boundary points for same-ellipse
  arcs.

Public methods:

- `getIntersections(primitiveA, primitiveB)`
- `getAllIntersections(primitives)`
- `getSplitIntersections(primitives)`
- `getSplitIntersectionPoints(primitives)`

`getSplitIntersections()` filters endpoint/endpoint contacts, because those are usually
existing primitive continuity rather than a new split point.

With `PathPrimitiveWithOrigin` metadata, only adjacent primitives in the same source path are
treated as existing continuity. Without metadata, endpoint/endpoint contacts keep the legacy
filtering behavior.

### PathPrimitiveSplitService

Splits:

- `Segment`
- `CornerDefinitionArcCenter`

Split parameters come from `PathPrimitiveIntersection.parameterA/parameterB`. Endpoint
parameters are ignored with epsilon comparisons. Returned split primitives keep computed
coordinates/angles without rounding or snapping.

### PathPrimitiveArrangementService

Pipeline:

```txt
PathPrimitive[] | PathPrimitiveWithOrigin[]
  -> split primitives
  -> graph nodes/half-edges
  -> closed interior faces
```

The arrangement graph compares points with epsilon to connect nodes, but keeps the original
point values. Faces store directed boundary edges, boundary primitives, node points, and an
analytic signed area computed from the boundary line integral. Segment area uses the standard
shoelace contribution. Arc area uses the center-arc integral:

```txt
1/2 * (rx * ry * deltaAngle + cx * (end.y - start.y) - cy * (end.x - start.x))
```

## Known Design Decisions

- Keep classes instead of interfaces when runtime checks are useful (`instanceof`).
- Keep geometry objects separate from SVG command objects.
- Keep SVG-specific command conversion in services, not geometry classes.
- Keep `largeArcFlag` / `sweepFlag` outside `CornerDefinitionArcCenter`; they are SVG endpoint command concepts.
- Use `CornerDefinitionArcCenter` as the main calculated arc representation.
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

This command should pass before handing work back.

## Next Refactors

1. Add focused tests for origin-aware split filtering, primitive splitting, arc/arc tangency,
   same-ellipse arc overlap boundaries, quartic ellipse/ellipse intersections, and face
   extraction.
