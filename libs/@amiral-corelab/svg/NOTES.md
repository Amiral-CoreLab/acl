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
- `SegmentSegmentIntersectionService` uses the standard equation `p + t*r = q + u*s` and
  returns overlap boundary points for collinear overlapping segments.
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

## Logic Improvement Candidates Before Primitive Splitting

The current implementation should stay focused on:

```txt
PathPrimitive[] -> candidate primitive pairs -> exact primitive intersections -> split points
```

Do not add primitive splitting, arrangement graphs, or face extraction before this layer is
stable.

### 1. SVG Endpoint Arc Conversion

`CornerDefinitionArcCenter` is the geometry format used internally, but SVG `A` commands use
endpoint parameterization. When `CornerDefinitionArcSvg -> CornerDefinitionArcCenter` is added,
it should follow the SVG implementation notes exactly:

- zero `rx` or `ry` means the arc is equivalent to a straight line;
- radii are made positive;
- out-of-range radii are scaled up before center conversion;
- SVG command `axisRotation` is in degrees, but center geometry uses radians.

Refs:

- https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
- https://www.w3.org/TR/SVG/implnote.html#ArcCorrectionOutOfRangeRadii

### 2. Intersections With Overlap Intervals

`PathPrimitiveIntersection` currently represents one point with `parameterA` and `parameterB`.
For split-point discovery this is workable, but mathematically there are intersections that are
intervals:

- collinear overlapping `Segment`/`Segment`;
- overlapping arcs on the same ellipse;
- degenerate SVG zero-radius arcs after they are treated as lines.

Current behavior returns overlap boundary points for segment/segment and same-ellipse arc/arc
cases. This is useful for future splitting, but it is not a full overlap model.

Action: before building a real splitter, add a second result shape for overlap intervals, for
example `PathPrimitiveOverlap`, with start/end parameters on both primitives.

### 3. Arc/Arc Robustness

`ArcArcIntersectionService` uses the standard quartic route for distinct ellipses:

```txt
arc A center-parametric equation
  -> substitute into arc B implicit ellipse equation
  -> convert trigonometric equation with tan(angle / 2)
  -> isolate real polynomial roots
```

This is more standard than angular sampling. Remaining risk is numerical robustness around
near-identical ellipses, repeated roots, very small radii, and very large coordinate values.

Action: keep the quartic approach, but later compare difficult fixtures against a specialized
robust ellipse/ellipse algorithm before trusting it for arbitrary user input.

Ref:

- https://www.geometrictools.com/Documentation/RobustIntersectionOfEllipses.pdf

### 4. Scale-Aware Tolerances

Fixed tolerances are easy to reason about, but SVG user coordinates can be very small or very
large. Current fixed values:

- `epsilon = 1e-9` for geometric comparisons;
- `implicitEquationEpsilon = 1e-7` for quartic/implicit ellipse equation values.

Action: introduce a tolerance policy based on primitive bounding boxes:

- point epsilon relative to local bounding-box diagonal;
- area-free parameter epsilon for `[0, 1]` interval checks;
- implicit equation epsilon based on normalized polynomial coefficients and coordinate scale.

### 5. Degenerate Primitive Normalization

Intersection services currently skip invalid geometry locally. A clearer pipeline would
normalize primitives before pair generation:

- remove zero-length segments unless the caller explicitly wants point contacts;
- remove zero-delta arcs;
- convert zero-radius SVG arcs to segments during SVG endpoint conversion;
- decide how complete ellipses should be represented, because a single SVG endpoint `A`
  command cannot represent a full ellipse with identical start and end points.

### 6. Naming And Responsibility

Keep naming strict around units and coordinate spaces:

- use `axisRotation` only with a documented unit: degrees for SVG commands, radians for center
  geometry;
- use `local...` names for coordinates transformed into an arc's local ellipse frame;
- keep SVG command conversion in `PathPrimitiveCommandService`;
- keep centered arc math in `ArcCenterGeometryService`;
- keep exact primitive intersections in the three focused intersection services.
