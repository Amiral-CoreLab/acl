import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveArcCenter } from '../classes';
import { PathPrimitiveIntersection, Point } from '../classes';
import { ArcCenterService } from './arc-center.service';
import { AngleService } from './angle.service';

/**
 * Computes intersections between center-parameterized arcs.
 *
 * Distinct ellipse intersections are found by substituting one arc's parametric ellipse into
 * the other arc's implicit ellipse equation. Same-ellipse arcs are handled separately by
 * checking endpoint overlap candidates.
 *
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 * @see https://www.geometrictools.com/Documentation/RobustIntersectionOfEllipses.pdf
 */
@Singleton()
export class ArcArcIntersectionService {
  private readonly epsilon = 1e-9;
  private readonly implicitEquationEpsilon = 1e-7;
  private readonly arcCenterGeometryService = getSingleton(ArcCenterService);
  private readonly angleService = getSingleton(AngleService);

  private isZero(value: number): boolean {
    return Math.abs(value) <= this.epsilon;
  }

  private isNearlySamePoint(pointA: Point, pointB: Point): boolean {
    return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) <= this.epsilon;
  }

  private getPointInLocalCoordinates(point: Point, arc: PathPrimitiveArcCenter): Point {
    return this.arcCenterGeometryService.getPointInLocalCoordinates(point, arc);
  }

  private getSmallestAxisAngleDifference(angleA: number, angleB: number): number {
    const halfTurn = Math.PI;
    const difference = (((angleA - angleB) % halfTurn) + halfTurn) % halfTurn;

    return Math.min(difference, halfTurn - difference);
  }

  private haveSameOrientation(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter): boolean {
    return this.getSmallestAxisAngleDifference(arcA.axisRotation, arcB.axisRotation) <= this.epsilon;
  }

  private havePerpendicularOrientation(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter): boolean {
    return this.getSmallestAxisAngleDifference(arcA.axisRotation + Math.PI / 2, arcB.axisRotation) <= this.epsilon;
  }

  private areSameEllipse(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter): boolean {
    if (!this.isNearlySamePoint(arcA.center, arcB.center)) {
      return false;
    }

    return (
      (Math.abs(arcA.radiusX - arcB.radiusX) <= this.epsilon &&
        Math.abs(arcA.radiusY - arcB.radiusY) <= this.epsilon &&
        this.haveSameOrientation(arcA, arcB)) ||
      (Math.abs(arcA.radiusX - arcB.radiusY) <= this.epsilon &&
        Math.abs(arcA.radiusY - arcB.radiusX) <= this.epsilon &&
        this.havePerpendicularOrientation(arcA, arcB))
    );
  }

  private getPolynomialValue(coefficients: number[], value: number): number {
    return [...coefficients].reverse().reduce((result, coefficient) => result * value + coefficient, 0);
  }

  private trimPolynomial(coefficients: number[]): number[] {
    const trimmed = [...coefficients];

    while (trimmed.length > 1 && Math.abs(trimmed[trimmed.length - 1] ?? 0) <= this.epsilon) {
      trimmed.pop();
    }

    return trimmed;
  }

  private normalizePolynomial(coefficients: number[]): number[] {
    const largestCoefficient = coefficients.reduce(
      (maximum, coefficient) => Math.max(maximum, Math.abs(coefficient)),
      0,
    );

    if (largestCoefficient <= this.epsilon) {
      return coefficients;
    }

    return coefficients.map((coefficient) => coefficient / largestCoefficient);
  }

  private getPolynomialDerivative(coefficients: number[]): number[] {
    return coefficients.slice(1).map((coefficient, index) => coefficient * (index + 1));
  }

  private getPolynomialRootBound(coefficients: number[]): number {
    const trimmedCoefficients = this.trimPolynomial(coefficients);
    const leadingCoefficient = Math.abs(trimmedCoefficients[trimmedCoefficients.length - 1] ?? 1);

    if (leadingCoefficient <= this.epsilon) {
      return 1;
    }

    const largestRatio = trimmedCoefficients
      .slice(0, -1)
      .reduce((maximum, coefficient) => Math.max(maximum, Math.abs(coefficient) / leadingCoefficient), 0);

    return 1 + largestRatio;
  }

  private deduplicateNumbers(values: number[], epsilon = this.epsilon): number[] {
    return [...values]
      .sort((valueA, valueB) => valueA - valueB)
      .filter(
        (value, index, sortedValues) => index === 0 || Math.abs(value - (sortedValues[index - 1] ?? value)) > epsilon,
      );
  }

  private bisectRoot(coefficients: number[], start: number, end: number): number {
    let bracketStart = start;
    let bracketEnd = end;
    let startValue = this.getPolynomialValue(coefficients, bracketStart);

    for (let iteration = 0; iteration < 96; iteration += 1) {
      const middle = (bracketStart + bracketEnd) / 2;
      const middleValue = this.getPolynomialValue(coefficients, middle);

      if (Math.abs(middleValue) <= this.implicitEquationEpsilon) {
        return middle;
      }

      if (startValue * middleValue <= 0) {
        bracketEnd = middle;
      } else {
        bracketStart = middle;
        startValue = middleValue;
      }
    }

    return (bracketStart + bracketEnd) / 2;
  }

  private getRealPolynomialRoots(coefficients: number[]): number[] {
    const trimmedCoefficients = this.trimPolynomial(this.normalizePolynomial(coefficients));
    const degree = trimmedCoefficients.length - 1;

    if (degree <= 0) {
      return [];
    }

    if (degree === 1) {
      const [constant = 0, linear = 0] = trimmedCoefficients;

      return Math.abs(linear) <= this.epsilon ? [] : [-constant / linear];
    }

    const bound = this.getPolynomialRootBound(trimmedCoefficients);
    const derivativeRoots = this.getRealPolynomialRoots(this.getPolynomialDerivative(trimmedCoefficients)).filter(
      (root) => root >= -bound - this.epsilon && root <= bound + this.epsilon,
    );
    const criticalPoints = this.deduplicateNumbers([-bound, ...derivativeRoots, bound]);
    const roots: number[] = [];

    for (const criticalPoint of criticalPoints) {
      if (Math.abs(this.getPolynomialValue(trimmedCoefficients, criticalPoint)) <= this.implicitEquationEpsilon) {
        roots.push(criticalPoint);
      }
    }

    for (let index = 0; index < criticalPoints.length - 1; index += 1) {
      const intervalStart = criticalPoints[index];
      const intervalEnd = criticalPoints[index + 1];

      if (
        intervalStart === undefined ||
        intervalEnd === undefined ||
        Math.abs(intervalEnd - intervalStart) <= this.epsilon
      ) {
        continue;
      }

      const intervalStartValue = this.getPolynomialValue(trimmedCoefficients, intervalStart);
      const intervalEndValue = this.getPolynomialValue(trimmedCoefficients, intervalEnd);

      if (
        Math.abs(intervalStartValue) <= this.implicitEquationEpsilon ||
        Math.abs(intervalEndValue) <= this.implicitEquationEpsilon
      ) {
        continue;
      }

      if (intervalStartValue * intervalEndValue < 0) {
        roots.push(this.bisectRoot(trimmedCoefficients, intervalStart, intervalEnd));
      }
    }

    return this.deduplicateNumbers(roots, Math.sqrt(this.epsilon));
  }

  private deduplicateIntersections(intersections: PathPrimitiveIntersection[]): PathPrimitiveIntersection[] {
    return intersections.filter((intersection, index) =>
      intersections.every(
        (otherIntersection, otherIndex) =>
          otherIndex >= index || !this.isNearlySamePoint(intersection.point, otherIntersection.point),
      ),
    );
  }

  private getSameEllipseArcIntersections(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
  ): PathPrimitiveIntersection[] {
    const candidatePoints = [arcA.start, arcA.end, arcB.start, arcB.end];

    return this.deduplicateIntersections(
      candidatePoints.flatMap((point) => {
        const angleA = this.arcCenterGeometryService.getPointAngleOnArc(point, arcA);
        const angleB = this.arcCenterGeometryService.getPointAngleOnArc(point, arcB);

        if (
          !this.arcCenterGeometryService.isAngleOnArc(angleA, arcA.startAngle, arcA.deltaAngle) ||
          !this.arcCenterGeometryService.isAngleOnArc(angleB, arcB.startAngle, arcB.deltaAngle)
        ) {
          return [];
        }

        return [
          new PathPrimitiveIntersection({
            point: arcA.getPointAtAngle(angleA),
            primitiveA: arcA,
            primitiveB: arcB,
            parameterA: this.arcCenterGeometryService.getAngleParameterOnArc(angleA, arcA),
            parameterB: this.arcCenterGeometryService.getAngleParameterOnArc(angleB, arcB),
          }),
        ];
      }),
    );
  }

  private getEllipseValue(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter, angleA: number): number {
    return this.arcCenterGeometryService.getPointEllipseValue(arcA.getPointAtAngle(angleA), arcB);
  }

  private getEllipseIntersectionPolynomial(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter): number[] {
    const cosA = Math.cos(arcA.axisRotation);
    const sinA = Math.sin(arcA.axisRotation);
    const center = this.getPointInLocalCoordinates(arcA.center, arcB);
    const localCosPoint = this.getPointInLocalCoordinates(
      new Point({
        x: arcA.center.x + cosA * arcA.radiusX,
        y: arcA.center.y + sinA * arcA.radiusX,
      }),
      arcB,
    );
    const localSinPoint = this.getPointInLocalCoordinates(
      new Point({
        x: arcA.center.x - sinA * arcA.radiusY,
        y: arcA.center.y + cosA * arcA.radiusY,
      }),
      arcB,
    );
    const cosVector = center.getVectorTo(localCosPoint);
    const sinVector = center.getVectorTo(localSinPoint);
    const radiusXSquared = arcB.radiusX ** 2;
    const radiusYSquared = arcB.radiusY ** 2;
    const cosSquared = cosVector.x ** 2 / radiusXSquared + cosVector.y ** 2 / radiusYSquared;
    const sinSquared = sinVector.x ** 2 / radiusXSquared + sinVector.y ** 2 / radiusYSquared;
    const sinCos = 2 * ((cosVector.x * sinVector.x) / radiusXSquared + (cosVector.y * sinVector.y) / radiusYSquared);
    const cos = 2 * ((center.x * cosVector.x) / radiusXSquared + (center.y * cosVector.y) / radiusYSquared);
    const sin = 2 * ((center.x * sinVector.x) / radiusXSquared + (center.y * sinVector.y) / radiusYSquared);
    const constant = center.x ** 2 / radiusXSquared + center.y ** 2 / radiusYSquared - 1;

    return [
      cosSquared + cos + constant,
      2 * sinCos + 2 * sin,
      -2 * cosSquared + 4 * sinSquared + 2 * constant,
      -2 * sinCos + 2 * sin,
      cosSquared - cos + constant,
    ];
  }

  private getEllipseIntersectionAngles(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter): number[] {
    const polynomial = this.getEllipseIntersectionPolynomial(arcA, arcB);
    const angles = this.getRealPolynomialRoots(polynomial).map((root) => 2 * Math.atan(root));

    if (Math.abs(this.getEllipseValue(arcA, arcB, Math.PI)) <= this.implicitEquationEpsilon) {
      angles.push(Math.PI);
    }

    return this.deduplicateNumbers(
      angles.map((angle) => this.angleService.normalizeRadians(angle)),
      Math.sqrt(this.epsilon),
    );
  }

  private createIntersections(
    arcA: PathPrimitiveArcCenter,
    arcB: PathPrimitiveArcCenter,
    angleA: number,
  ): PathPrimitiveIntersection[] {
    const point = arcA.getPointAtAngle(angleA);
    const angleB = this.arcCenterGeometryService.getPointAngleOnArc(point, arcB);

    if (!this.arcCenterGeometryService.isAngleOnArc(angleB, arcB.startAngle, arcB.deltaAngle)) {
      return [];
    }

    return [
      new PathPrimitiveIntersection({
        point,
        primitiveA: arcA,
        primitiveB: arcB,
        parameterA: this.arcCenterGeometryService.getAngleParameterOnArc(angleA, arcA),
        parameterB: this.arcCenterGeometryService.getAngleParameterOnArc(angleB, arcB),
      }),
    ];
  }

  /**
   * Computes intersections between two center arcs.
   *
   * Intersections between distinct ellipses are found by substituting the first arc's
   * center-parameterized equation into the second ellipse's implicit equation. The resulting
   * trigonometric quadratic is converted to a quartic with `tan(angle / 2)`, then real roots
   * are isolated numerically. Same-ellipse overlaps return the overlap boundary points,
   * which gives split points without manufacturing a single arbitrary overlap point.
   *
   * @param arcA First arc.
   * @param arcB Second arc.
   *
   * @returns Intersections between both arcs.
   */
  public getIntersections(arcA: PathPrimitiveArcCenter, arcB: PathPrimitiveArcCenter): PathPrimitiveIntersection[] {
    if (
      this.isZero(arcA.radiusX) ||
      this.isZero(arcA.radiusY) ||
      this.isZero(arcB.radiusX) ||
      this.isZero(arcB.radiusY)
    ) {
      return [];
    }

    if (this.areSameEllipse(arcA, arcB)) {
      return this.getSameEllipseArcIntersections(arcA, arcB);
    }

    return this.deduplicateIntersections(
      this.getEllipseIntersectionAngles(arcA, arcB).flatMap((angle) => {
        if (Math.abs(this.getEllipseValue(arcA, arcB, angle)) > this.implicitEquationEpsilon) {
          return [];
        }

        return this.createIntersections(arcA, arcB, angle);
      }),
    );
  }
}
