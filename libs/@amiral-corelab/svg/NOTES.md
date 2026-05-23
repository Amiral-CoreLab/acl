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

## Logic Improvement Candidates

These are not just test gaps. They are implementation areas that should be improved or at
least explicitly decided before relying on the library for complex arrangements.

### 1. SVG Arc Endpoint Semantics

The SVG implementation notes define endpoint-arc behavior that is stricter than our current
center-arc-focused model:

- If either endpoint-arc radius is zero, the arc is treated as a straight line.
- Endpoint-arc radii are made positive.
- Out-of-range radii are scaled so the endpoint-to-center conversion has a valid solution.

Action: when implementing `CornerDefinitionArcSvg -> CornerDefinitionArcCenter`, follow the SVG
implementation notes exactly and document where `axisRotation` changes from degrees to radians.

Refs:

- https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
- https://www.w3.org/TR/SVG/implnote.html#ArcCorrectionOutOfRangeRadii

### 2. Overlapping Primitive Intersections

Current exact intersections focus on point intersections. That is enough for many splits, but
not enough for robust arrangements:

- collinear overlapping `Segment`/`Segment` currently needs explicit interval overlap handling;
- same-ellipse `Arc`/`Arc` returns overlap boundary points, but does not model the overlap
  interval itself;
- segment/arc overlap is rare for true ellipses but possible for degenerate arcs or after
  treating SVG zero-radius arcs as lines.

Action: add an intersection result type that can represent either point intersections or
overlap intervals. Splitting can then use interval boundaries, while graph construction can
avoid duplicate coincident edges.

### 3. Arc/Arc Robustness

`ArcArcIntersectionService` now uses the standard quartic formulation for distinct ellipses:
substitute arc A's center-parametric ellipse into arc B's implicit ellipse equation, convert
with `tan(angle / 2)`, and isolate real roots.

Remaining risks:

- near-identical but not exactly identical ellipses can still be numerically hard;
- repeated roots/tangencies depend on value tolerances;
- the current root isolation is maintainable but not a specialized robust ellipse/ellipse
  algorithm.

Action: if production input includes near-degenerate or near-overlapping ellipses, compare this
implementation against a specialized robust ellipse/ellipse algorithm and add fixtures for
those cases.

Ref:

- https://www.geometrictools.com/Documentation/RobustIntersectionOfEllipses.pdf

### 4. Face Traversal Should Use Edge Tangents

The arrangement graph currently sorts outgoing half-edges using the chord angle from primitive
start to primitive end. For straight segments this is correct. For arcs, the local ordering at
a node should use the tangent direction at the node, not the chord direction.

Why it matters:

- two different arcs can have similar endpoints but different tangents;
- face traversal around curved subdivisions depends on local embedding order;
- chord sorting can choose the wrong next half-edge at high-curvature or near-coincident arc
  junctions.

Action: add primitive tangent helpers:

- segment tangent = end - start;
- arc start tangent = derivative at `startAngle`;
- arc end tangent = derivative at `startAngle + deltaAngle`;
- reverse half-edges should use the tangent of the reversed primitive at its own start.

### 5. Use A Fuller DCEL-Like Model For Faces

The current graph has nodes and directed edges, enough for a first face extraction. A fuller
DCEL-style model would make topology easier to validate and extend:

- explicit `twin`, `next`, `previous`, and `face` references;
- support for holes;
- explicit outer face;
- better duplicate/coincident edge handling.

Action: evolve `PathPrimitiveArrangement` toward a DCEL when face extraction starts handling
multiple paths with holes, shared borders, or nested contours.

Refs:

- https://en.wikipedia.org/wiki/Doubly_connected_edge_list
- https://www.holmes3d.net/graphics/dcel/

### 6. Scale-Aware Tolerances

Several tolerances are fixed (`epsilon`, `rootValueEpsilon`, `areaEpsilon`). Fixed tolerances
are simple, but geometry can be tiny or huge depending on the SVG viewBox/user coordinate
system.

Action: introduce a tolerance policy based on the input bounding box scale:

- point/length epsilon relative to diagonal length;
- area epsilon relative to bounding-box area;
- polynomial/root tolerances based on normalized coefficients and geometry scale.

### 7. Origin Metadata After Splitting

`PathPrimitiveSplitService` emits fresh primitive indexes after splitting. This is useful for
the next arrangement stage, but it loses detailed ancestry such as "this split primitive came
from original primitive X between parameters A and B".

Action: extend split output metadata with source primitive id and source parameter range. This
will help debugging, selection mapping, and later face-to-path attribution.

### 8. Zero-Length And Degenerate Primitives

Several services skip or ignore zero-length geometry locally. It would be cleaner to define one
normalization step before intersections:

- remove zero-length segments;
- remove zero-delta arcs;
- convert SVG zero-radius arcs to segments;
- decide how to handle full ellipses, because SVG path `A` commands cannot directly encode a
  complete ellipse as one endpoint arc with identical start/end.

Action: add a primitive normalization service before broad-phase pair creation.
