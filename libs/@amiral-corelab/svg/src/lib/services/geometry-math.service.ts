import { Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveSegment, Point, Vector } from '../classes';
import type { GeometryTolerance } from './geometry-tolerance.service';

/**
 * Centralizes low-level geometry formulas used by path intersection services.
 *
 * The methods are intentionally small and named after the mathematical operation they
 * implement. This keeps higher-level services readable against geometry references.
 */
@Singleton()
export class GeometryMathService {
  private readonly floatingPointOrientationErrorMultiplier = 4;

  /**
   * Tests whether a scalar is close enough to zero for a given tolerance.
   */
  public isNearlyZero(value: number, tolerance: number): boolean {
    return Math.abs(value) <= tolerance;
  }

  /**
   * Clamps a scalar to an inclusive range.
   */
  public clamp(value: number, minimum: number, maximum: number): number {
    return Math.max(minimum, Math.min(maximum, value));
  }

  /**
   * Clamps a normalized curve parameter to `[0, 1]`.
   */
  public clampUnitParameter(parameter: number): number {
    return this.clamp(parameter, 0, 1);
  }

  /**
   * Tests whether a parameter lies in `[0, 1]`, including tolerance drift.
   */
  public isInUnitInterval(parameter: number, tolerance: GeometryTolerance): boolean {
    return parameter >= -tolerance.parameter && parameter <= 1 + tolerance.parameter;
  }

  /**
   * Computes Euclidean distance between two points.
   */
  public getDistance(pointA: Point, pointB: Point): number {
    return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
  }

  /**
   * Tests whether two points represent the same geometric location within tolerance.
   */
  public areNearlySamePoints(pointA: Point, pointB: Point, tolerance: GeometryTolerance): boolean {
    return this.getDistance(pointA, pointB) <= tolerance.distance;
  }

  /**
   * Gets a scale-aware tolerance for signed area / cross-product predicates.
   */
  public getAreaTolerance(tolerance: GeometryTolerance): number {
    return tolerance.distance * tolerance.scale;
  }

  /**
   * Computes robust point orientation.
   *
   * Returns `1` for counter-clockwise, `-1` for clockwise, and `0` for collinear under the
   * supplied tolerance policy.
   */
  public getOrientation(pointA: Point, pointB: Point, pointC: Point, tolerance: GeometryTolerance): number {
    const vectorAB = pointA.getVectorTo(pointB);
    const vectorAC = pointA.getVectorTo(pointC);
    const determinant = vectorAB.getCrossProduct(vectorAC);
    const determinantScale = Math.max(
      Math.abs(vectorAB.x * vectorAC.y),
      Math.abs(vectorAB.y * vectorAC.x),
      tolerance.scale,
      1,
    );
    const floatingPointError = Number.EPSILON * this.floatingPointOrientationErrorMultiplier * determinantScale;
    const orientationTolerance = Math.max(this.getAreaTolerance(tolerance), floatingPointError);

    if (determinant > orientationTolerance) {
      return 1;
    }

    if (determinant < -orientationTolerance) {
      return -1;
    }

    return 0;
  }

  /**
   * Evaluates a point on a finite segment using normalized parameter `t`.
   */
  public getPointAtSegmentParameter(segment: PathPrimitiveSegment, parameter: number): Point {
    return segment.start.moveAlongVector(segment.start.getVectorTo(segment.end), parameter);
  }

  /**
   * Projects a point onto an origin + direction line and returns the normalized parameter.
   */
  public getProjectionParameter(origin: Point, direction: Vector, point: Point): number {
    return origin.getVectorTo(point).getDotProduct(direction) / direction.getLengthSquared();
  }

  /**
   * Evaluates the diagonal quadratic form used by a local ellipse.
   */
  public getEllipseQuadraticFormValue(
    localPointA: Point | Vector,
    localPointB: Point | Vector,
    radiusX: number,
    radiusY: number,
  ): number {
    return (localPointA.x * localPointB.x) / radiusX ** 2 + (localPointA.y * localPointB.y) / radiusY ** 2;
  }

  /**
   * Evaluates `x²/rx² + y²/ry²` for a local ellipse point.
   */
  public getEllipseRadiusNormalizedSquared(localPoint: Point | Vector, radiusX: number, radiusY: number): number {
    return this.getEllipseQuadraticFormValue(localPoint, localPoint, radiusX, radiusY);
  }

  /**
   * Evaluates the local implicit ellipse equation.
   *
   * A point on the ellipse returns `0`, an inside point returns a negative value, and an
   * outside point returns a positive value.
   */
  public getImplicitEllipseResidual(localPoint: Point | Vector, radiusX: number, radiusY: number): number {
    return this.getEllipseRadiusNormalizedSquared(localPoint, radiusX, radiusY) - 1;
  }

  /**
   * Computes the center-parameterized ellipse angle for a local point.
   */
  public getEllipseParameterAngle(localPoint: Point, radiusX: number, radiusY: number): number {
    return Math.atan2(localPoint.y / radiusY, localPoint.x / radiusX);
  }

  /**
   * Converts a rounded-corner angle to the tangent half-angle value.
   */
  public getHalfAngleTangent(angle: number): number {
    return Math.tan(angle / 2);
  }

  /**
   * Converts a circle radius and half-angle tangent into an edge tangent offset.
   */
  public getRadiusTangentOffset(radius: number, halfAngleTangent: number): number {
    return radius / halfAngleTangent;
  }

  /**
   * Gets the proportional scale needed to fit a consumed length inside an available length.
   */
  public getFitScale(availableLength: number, consumedLength: number): number {
    return availableLength / consumedLength;
  }
}
