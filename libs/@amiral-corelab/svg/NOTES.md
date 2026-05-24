# SVG Geometry Notes

## Scope

Current scope:

```txt
Path authoring model
-> drawable path primitives
-> primitive-pair intersections
```

Current target workflow:

```txt
1. Convertir chaque Path en primitives
   PathPrimitiveSegment | PathPrimitiveArcCenter

2. Trouver toutes les intersections entre primitives
   segment/segment
   segment/arc
   arc/arc
```

Out of scope for the current implementation:

- splitting primitives into atomic edges
- planar graph construction
- face extraction
- boolean operations
- SVG path parsing
- Bezier primitive resolution/intersection

## Source Layout

Main code lives in:

```txt
libs/@amiral-corelab/svg/src/lib
```

Important groups:

- `classes/`: immutable geometry, path, command, primitive, and metadata objects.
- `factories/`: conversion and construction logic.
- `services/`: geometry algorithms, intersections, tolerances, and angle helpers.
- `stores/operation/`: operation result objects used to return success/warning/error state.

## SVG Model Used

SVG path data is based on a current point. Drawing commands move the current point, draw a
line, draw a curve, draw an arc, or close a subpath. The code uses the same separation:

- `PathCommandMove` serializes `M`.
- `PathCommandLine` serializes `L`.
- `PathCommandArc` serializes `A`.
- `PathCommandClose` serializes `Z`.

References:

- SVG path data and command model: https://www.w3.org/TR/SVG2/paths.html#PathData
- SVG `d` property: https://www.w3.org/TR/SVG2/paths.html#DProperty
- SVG moveto commands: https://www.w3.org/TR/SVG2/paths.html#PathDataMovetoCommands
- SVG lineto commands: https://www.w3.org/TR/SVG2/paths.html#PathDataLinetoCommands
- SVG closepath commands: https://www.w3.org/TR/SVG2/paths.html#PathDataClosePathCommand
- SVG elliptical arc commands: https://www.w3.org/TR/SVG2/paths.html#PathDataEllipticalArcCommands

## Coordinate Model

The geometry layer assumes SVG user coordinates.

- `Point` is a position.
- `Vector` is an offset/direction.
- `Point.moveAlongVector(vector, scale)` creates a translated point.
- `Point.getVectorTo(point)` creates the vector `point - this`.
- `Vector.getLength()` uses Euclidean length.
- `Vector.getDotProduct()` supports angle and projection logic.
- `Vector.getUnsignedAngleTo()` clamps the dot product before `acos`.
- `Vector.getSignedAngleTo()` uses `atan2(cross, dot)` to preserve orientation.
- `Vector.normalize()` returns a zero vector for a zero-length vector.

Reference:

- SVG coordinate systems and user units: https://www.w3.org/TR/SVG2/coords.html

## Authoring Model

### `Path`

`Path` stores authoring data:

- ordered `vertices`
- `closed`

It does not store final drawable geometry. Drawable geometry is generated on demand.

Public outputs:

- `toPrimitives()`: returns geometry only.
- `toPrimitivesWithOrigin(pathId)`: returns primitives wrapped with path-origin metadata.
- `toCommands()`: returns SVG command objects.
- `toD()`: serializes commands to an SVG `d` value.

For intersection/split workflows, prefer `toPrimitivesWithOrigin(pathId)` so adjacent
primitives from the same path can be identified and filtered as existing continuity.

### `Vertex`

`Vertex` extends `Point` and may carry a `cornerDefinition`.

Current corner definitions:

- `CornerDefinitionRadius`
- `CornerDefinitionBezier`

`CornerDefinitionBezier` currently stores editable handle vectors only. No Bezier primitive or
Bezier intersection logic exists yet.

## Radius Corner Resolution

Radius corners are resolved in two stages:

```txt
CornerDefinitionRadius
-> CornerDefinitionRadiusGeometry
-> PathPrimitiveArcCenter
```

### Corner Context

`Path.getCornersVertices()` creates `CornerVertices` only when a vertex has both neighbors.

Open path endpoints do not get corner geometry because they do not have both incoming and
outgoing edges. Closed paths wrap around.

### Radius Geometry

`CornerDefinitionRadiusGeometryFactory.fromCornerVertices()` computes radius geometry from:

- previous vertex
- current vertex
- next vertex
- requested radius

Math used:

- incoming vector: current -> previous
- outgoing vector: current -> next
- normalized incoming/outgoing unit vectors
- corner angle from unsigned vector angle
- tangent offset: `radius / tan(cornerAngle / 2)`

Degenerate radius cases are rejected through `OperationWarn`:

- current corner definition is not `CornerDefinitionRadius`
- radius is `<= 0`
- incoming/outgoing edge has zero length
- corner angle is near `0`
- corner angle is near `π`
- tangent offset is invalid or non-finite

The angle degeneracy checks currently use fixed epsilon inside
`CornerDefinitionRadiusGeometryFactory`.

References:

- SVG rounded rectangle radii use the same radius concept: https://www.w3.org/TR/SVG/shapes.html#RectElement
- SVG arc implementation notes use vector angle math: https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes

### Fitting Adjacent Radius Corners

`Path.getFittedCornerGeometries()` prevents two neighboring radius corners from consuming more
than the available logical path edge.

For each edge:

```txt
current outgoing tangent offset + next incoming tangent offset <= edge length
```

If the total tangent offset is too large, both offsets are scaled proportionally:

```txt
scale = edgeLength / totalTangentOffset
```

Then each corner is rebuilt with the fitted tangent offset via
`CornerDefinitionRadiusGeometry.withTangentOffset()`.

This keeps tangent points on the same logical edge instead of allowing rounded corners to
cross over each other.

### Arc Primitive Creation

`CornerDefinitionArcCenterFactory.fromRadiusGeometry()` converts fitted radius geometry into
`PathPrimitiveArcCenter`.

Math used:

- center direction is the normalized sum of incoming/outgoing unit vectors
- center distance is `radius / sin(cornerAngle / 2)`
- start angle comes from center -> entry vector
- delta angle is the signed angle from start vector to end vector
- radius corners currently become circular arcs: `radiusX = radiusY = radius`
- `axisRotation = 0`

## Path Primitive Model

`PathPrimitive` is a small abstract base:

```ts
abstract class PathPrimitive {
  readonly start: Point;
  readonly end: Point;
}
```

Current concrete primitives:

- `PathPrimitiveSegment`
- `PathPrimitiveArcCenter`

### `PathPrimitiveSegment`

Represents a finite straight segment with explicit `start` and `end` points.

### `PathPrimitiveArcCenter`

Represents a center-parameterized elliptical arc:

- `center`
- `radiusX`
- `radiusY`
- `axisRotation` in radians
- `startAngle` in radians
- `deltaAngle` in radians

`start` and `end` are derived with `getPointAtAngle()`.

Center-parameterized arcs are useful for math. SVG `A` commands use endpoint parameters, so
command conversion is intentionally separate.

Reference:

- SVG endpoint/center arc conversion: https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter

## SVG Command Conversion

`PathCommandFactory` converts primitives into SVG command objects.

Rules:

- first primitive start -> `PathCommandMove`
- `PathPrimitiveSegment` -> `PathCommandLine`
- `PathPrimitiveArcCenter` -> `PathCommandArc`
- closed path -> `PathCommandClose`

Arc conversion:

- `axisRotation` is converted from radians to SVG degrees.
- `largeArcFlag = abs(deltaAngle) > π ? 1 : 0`
- `sweepFlag = deltaAngle >= 0 ? 1 : 0`

Design rule:

SVG endpoint-command concepts, such as `largeArcFlag` and `sweepFlag`, stay outside geometry
classes. They belong in `PathCommandFactory`.

## Origin Metadata

`PathPrimitiveOrigin` stores:

- `pathId`
- `primitiveIndex`
- `previousPrimitiveIndex`
- `nextPrimitiveIndex`

`PathPrimitiveWithOrigin` wraps:

- `primitive`
- `origin`

This metadata is required for split/intersection workflows because adjacent primitives in the
same path naturally share endpoints. Those endpoint contacts are path continuity, not new split
points.

Current rule:

- `PathPrimitiveIntersectionService.getSplitIntersections()` accepts `PathPrimitiveWithOrigin[]`.
- endpoint/endpoint contacts are filtered only when origins prove both primitives are adjacent
  in the same source path.

## Bounding Boxes

`BoundingBox` stores axis-aligned bounds:

- `minX`
- `minY`
- `maxX`
- `maxY`
- derived `width`
- derived `height`

`BoundingBoxFactory` creates boxes from:

- min/max values
- point sets
- segment primitives
- center-arc primitives
- generic path primitives

Segment bounding boxes use the two endpoints.

Arc bounding boxes use:

- arc start
- arc end
- rotated ellipse x/y extremum candidate angles that lie on the arc sweep

This is used as broad-phase filtering before exact intersection checks.

References:

- SVG coordinate systems: https://www.w3.org/TR/SVG2/coords.html
- SVG DOM `getBBox()` concept: https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox

## Tolerance Policy

`GeometryToleranceService` derives tolerances from primitive bounding-box scale.

It returns:

- `distance`
- `parameter`
- `implicitEquation`
- `scale`

Scale is computed from:

- absolute bounding coordinates
- bounding box width/height
- minimum scale `1`

Current policy:

```txt
distance = max(1e-9, scale * 1e-9)
implicitEquation = max(1e-7, scale * 1e-12)
parameter = max(1e-9, distance / scale)
```

Why:

- fixed SVG-unit tolerances are too strict for large coordinates
- fixed SVG-unit tolerances can be too loose for tiny geometry
- endpoint checks need normalized parameter tolerance
- implicit ellipse checks need a residual tolerance

Remaining risk:

- constants still need tuning for extreme SVG coordinate ranges
- this is not exact arithmetic
- robust predicates are not implemented

Reference for possible future robust predicates:

- Shewchuk, adaptive precision predicates: https://www.cs.cmu.edu/~quake/robust.html

## Broad-Phase Pairing

`PathPrimitivePairService.getIntersectingBoundingBoxPairs()`:

1. receives `PathPrimitiveWithOrigin[]`
2. computes each primitive bounding box
3. compares each pair once
4. returns `PathPrimitivePair[]` for overlapping boxes

This is currently O(n²). It is simple and fine for small primitive counts.

## Exact Intersection Dispatch

`PathPrimitiveIntersectionService.getIntersections(a, b)` dispatches by runtime class:

- segment/segment -> `SegmentSegmentIntersectionService`
- segment/arc -> `SegmentArcIntersectionService`
- arc/segment -> same service with reversed result order
- arc/arc -> `ArcArcIntersectionService`

`getAllIntersections(inputs)`:

1. gets bounding-box candidate pairs
2. runs exact intersection checks
3. attaches pair origins to returned intersections

`getSplitIntersections(inputs)`:

1. gets all intersections
2. filters existing path continuity

`getSplitIntersectionPoints(inputs)`:

1. gets split intersections
2. deduplicates nearly identical points using scale-aware tolerance

## Segment/Segment Intersection

`SegmentSegmentIntersectionService` solves finite segment intersections.

Math model:

```txt
A(t) = A0 + t * (A1 - A0)
B(u) = B0 + u * (B1 - B0)
t, u in [0, 1]
```

Non-parallel segments are solved with the 2D cross-product form of:

```txt
A0 + t*r = B0 + u*s
```

Parallel cases:

- if not collinear -> no intersection
- if collinear -> project segment B endpoints on segment A
- overlap returns overlap boundary points
- a single-point overlap is deduplicated to one intersection

The service does not return an overlap interval object. It returns concrete intersection
points because the current next step is split-point discovery.

Reference:

- Parametric segment intersection
  explanation: https://persson.berkeley.edu/Programming_for_Mathematical_Applications/content/Computational_Geometry/Line_Segment_Interactions.html

## Segment/Arc Intersection

`SegmentArcIntersectionService` intersects a finite segment with a center-parameterized arc.

Algorithm:

1. transform segment endpoints into the arc local coordinate system
2. build a local segment direction
3. substitute the line segment equation into the implicit ellipse equation
4. solve the resulting quadratic
5. keep segment parameters in `[0, 1]`
6. compute the candidate ellipse angle
7. keep candidates whose angle lies on the arc sweep
8. return intersections in requested primitive order

Ellipse equation in local arc coordinates:

```txt
x² / rx² + y² / ry² - 1 = 0
```

Naming convention:

- variables in the arc local coordinate system are prefixed with `local`
- SVG user-coordinate points keep plain names such as `point`

This reduces coordinate-space bugs.

Reference:

- SVG arc implementation notes: https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes

## Arc/Arc Intersection

`ArcArcIntersectionService` intersects two center-parameterized arc primitives.

Zero-radius arcs are rejected.

Same-ellipse case:

- compare centers, radii, and axis orientations with scale-aware tolerance
- collect endpoint candidates
- keep candidates lying on both arc sweeps
- return boundary points

Distinct-ellipse case:

1. express arc A's parametric ellipse in arc B's local coordinate system
2. substitute into arc B's implicit ellipse equation
3. get a trigonometric equation in arc A's angle
4. convert with `t = tan(angle / 2)`
5. solve the resulting quartic polynomial numerically
6. map roots back to angles with `angle = 2 * atan(t)`
7. verify the implicit equation residual
8. verify the candidate lies on arc B's sweep
9. deduplicate nearly identical intersections

The root finder:

- trims near-zero high coefficients
- normalizes coefficients
- uses derivative roots to split the real line into intervals
- adds roots at critical points when residual is near zero
- bisects intervals with sign changes

Remaining risks:

- repeated roots can still be numerically delicate
- nearly identical ellipses depend on same-ellipse classification
- very small radii are rejected as zero
- very large coordinate ranges depend on tolerance tuning

References:

- SVG arc implementation notes: https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
- Robust ellipse intersection background: https://www.geometrictools.com/Documentation/RobustIntersectionOfEllipses.pdf

## Operation Results

`OperationStore` creates and records:

- `OperationSuccess<T>`
- `OperationWarn<T>`
- `OperationError<T>`

`CornerDefinitionRadiusGeometryFactory` uses this to return warnings instead of throwing when
corner geometry cannot be resolved.

Current `Path.toPrimitives()` behavior:

- reads `operation.result`
- invalid radius geometry becomes `undefined`
- missing corner geometry falls back to straight segment behavior
- diagnostics are recorded in `OperationStoreState.operations`, but `Path.toPrimitives()` does
  not expose them directly

## Current Limitations

- `Path.toPrimitives()` is still public and returns geometry without origin metadata.
- `CornerDefinitionBezier` exists as authoring data only.
- There is no `PathPrimitiveCubicBezier`.
- There is no Bezier-to-segment or Bezier-to-arc approximation.
- There is no split output model yet.
- There is no planar graph or face extraction yet.
- Broad-phase pair generation is O(n²).
- Arc/arc robustness is improved but not exact.
- Radius-corner degeneracy checks still use a local fixed epsilon in
  `CornerDefinitionRadiusGeometryFactory`.

## Improvements Possible In Current Scope

These improvements fit the current scope:

```txt
Path creation
-> PathPrimitiveSegment | PathPrimitiveArcCenter
-> segment/segment, segment/arc, arc/arc intersections
```

### Path Creation And Primitive Generation

- Make `Path.toPrimitives()` private or rename it to make origin-less usage explicit.
- Add a public `toPrimitiveResolution()` result that returns both primitives and operation
  diagnostics.
- Replace the fixed radius-corner epsilon with `GeometryToleranceService`.
- Rename `CornerDefinitionArcCenterFactory` to `PathPrimitiveArcCenterFactory` because it now
  creates primitives, not editable corner definitions.
- Add explicit validation for too-small fitted tangent offsets.
- Add tests for open-path endpoints, closed-path wrapping, radius fitting, and invalid radius
  definitions.

### SVG Command Conversion

- Add numeric formatting/rounding policy for `PathCommand.d` serialization.
- Add support for relative commands only if needed for export size.
- Add tests for `largeArcFlag`, `sweepFlag`, and radians-to-degrees conversion.
- Add explicit handling for full-circle arcs, because a single SVG `A` command cannot represent
  every full ellipse case unambiguously.

References:

- SVG path data syntax: https://www.w3.org/TR/SVG2/paths.html#PathData
- SVG elliptical arc commands: https://www.w3.org/TR/SVG2/paths.html#PathDataEllipticalArcCommands

### Bounding Boxes And Broad Phase

- Move all primitive bounding-box logic fully into `BoundingBoxFactory` and remove any
  duplicated bounding-box service if it becomes redundant.
- Add bounding-box inflation by tolerance before broad-phase tests.
- Add pair pruning using origin adjacency when the caller only wants split intersections.
- Replace O(n²) candidate-pair generation with a sweep-line or spatial index when primitive
  counts become large.

References:

- Sweep-line segment intersection background: https://epubs.siam.org/doi/10.1137/S0097539797329373
- SVG `getBBox()` concept: https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox

### Segment/Segment

- Replace cross-product near-zero tests with robust orientation predicates.
- Represent collinear overlaps as intervals in addition to boundary points.
- Add tests for endpoint touch, reversed segments, zero-length segments, partial overlap, full
  overlap, and near-collinear large-coordinate cases.

Reference:

- Robust predicates: https://www.cs.cmu.edu/~quake/robust.html

### Segment/Arc

- Add explicit tangent classification when the quadratic discriminant is near zero.
- Add residual verification after computing candidate points.
- Add tests for line tangent to arc, line crossing full ellipse but outside arc sweep, endpoint
  hits, tiny radii, and large coordinates.
- Consider sharing quadratic solving through a small polynomial helper.

Reference:

- SVG arc implementation notes: https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes

### Arc/Arc

- Extract polynomial utilities into a dedicated service if reused later.
- Improve same-ellipse arc overlap representation beyond endpoint boundary points.
- Add explicit repeated-root handling for tangent ellipses.
- Add tighter classification for nearly identical ellipses.
- Add tests for tangent arcs, overlapping same-ellipse arcs, perpendicular equivalent ellipses,
  tiny radii, and large coordinates.
- Consider robust ellipse-intersection techniques if quartic conditioning becomes a real issue.

Reference:

- Robust ellipse intersection background: https://www.geometrictools.com/Documentation/RobustIntersectionOfEllipses.pdf

### Bezier Support

`CornerDefinitionBezier` is present but not resolved into primitives.

Possible paths:

- add `PathPrimitiveCubicBezier`
- flatten Beziers into `PathPrimitiveSegment[]`
- approximate Beziers with `PathPrimitiveArcCenter[]` using biarc-style approximation

The cleanest next model is probably:

```txt
CornerDefinitionBezier
-> PathPrimitiveCubicBezier
-> optional flattening/arc approximation later
```

Reference:

- SVG cubic Bezier commands: https://www.w3.org/TR/SVG2/paths.html#PathDataCubicBezierCommands
