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

## Current Scope Improvements

These items are limited to the current scope:

```txt
Path -> PathPrimitive[]
PathPrimitive[] -> segment/segment, segment/arc, arc/arc intersections
```

### Path -> Primitives

- Radius-corner degeneracy checks should use epsilon comparisons, not exact angle equality.
  This is implemented in `CornerDefinitionRadiusGeometry`: corner angles near `0` or `π` are
  rejected with tolerance.
- The current `Path.toPrimitives()` pipeline silently drops invalid corner geometries by
  returning `undefined` when `CornerDefinitionRadiusGeometry.fromCornerVertices()` throws. This
  is pragmatic for rendering, but if authoring feedback matters later, expose diagnostics
  without changing the primitive output.
- `PathPrimitive` should remain exactly `Segment | CornerDefinitionArcCenter` at this layer.
  SVG endpoint command conversion is outside the current scope unless/when SVG path parsing is
  added.

### Primitive Intersections

- `SegmentSegmentIntersectionService` now returns boundary points for collinear overlaps. This
  is enough for split-point discovery, but it is not a complete mathematical representation of
  an overlap interval.
- `SegmentArcIntersectionService` uses explicit `local...` names for values transformed into
  the arc coordinate system. Keep this naming convention because mixed coordinate spaces are a
  common source of geometry bugs.
- `ArcArcIntersectionService` uses the standard ellipse/ellipse quartic approach instead of
  angular sampling. The remaining robustness risk is numerical conditioning around repeated
  roots, nearly identical ellipses, very small radii, and very large SVG user coordinates.
- Fixed tolerances (`epsilon = 1e-9`, `implicitEquationEpsilon = 1e-7`) are acceptable for the
  current code, but the next correctness improvement inside this same scope would be a
  scale-aware tolerance policy based on primitive bounding boxes.

### References Checked

- SVG path and arc command semantics:
  https://www.w3.org/TR/SVG2/paths.html#PathDataEllipticalArcCommands
- SVG arc implementation notes:
  https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
- SVG out-of-range arc radius correction:
  https://www.w3.org/TR/SVG/implnote.html#ArcCorrectionOutOfRangeRadii
- Robust ellipse/ellipse intersection background:
  https://www.geometrictools.com/Documentation/RobustIntersectionOfEllipses.pdf
