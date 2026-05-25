import { Singleton } from '@amiral-corelab/core';
import type { GeometryTolerance } from './geometry-tolerance.service';

export interface PolynomialRoot {
  isRepeated: boolean;
  value: number;
}

interface PolynomialInterval {
  end: number;
  start: number;
}

/**
 * Provides tolerance-aware helpers for real polynomial equations.
 *
 * Coefficients are stored in ascending degree order: `[constant, x, x^2, ...]`.
 */
@Singleton()
export class PolynomialEquationService {
  private isZero(value: number, tolerance: GeometryTolerance): boolean {
    return Math.abs(value) <= tolerance.implicitEquation;
  }

  private hasSignChange(valueA: number, valueB: number): boolean {
    return valueA * valueB < 0;
  }

  private isInsideRootBound(root: number, bound: number, tolerance: GeometryTolerance): boolean {
    return root >= -bound - tolerance.parameter && root <= bound + tolerance.parameter;
  }

  private getUsableInterval(
    start: number | undefined,
    end: number | undefined,
    tolerance: GeometryTolerance,
  ): PolynomialInterval | undefined {
    if (start === undefined || end === undefined || Math.abs(end - start) <= tolerance.parameter) {
      return undefined;
    }

    return { end, start };
  }

  public getValue(coefficients: number[], value: number): number {
    return [...coefficients].reverse().reduce((result, coefficient) => result * value + coefficient, 0);
  }

  public trim(coefficients: number[], tolerance: GeometryTolerance): number[] {
    const trimmed = [...coefficients];

    while (trimmed.length > 1 && Math.abs(trimmed[trimmed.length - 1] ?? 0) <= tolerance.implicitEquation) {
      trimmed.pop();
    }

    return trimmed;
  }

  public normalize(coefficients: number[], tolerance: GeometryTolerance): number[] {
    const largestCoefficient = coefficients.reduce(
      (maximum, coefficient) => Math.max(maximum, Math.abs(coefficient)),
      0,
    );

    if (this.isZero(largestCoefficient, tolerance)) {
      return coefficients;
    }

    return coefficients.map((coefficient) => coefficient / largestCoefficient);
  }

  public getDerivative(coefficients: number[]): number[] {
    return coefficients.slice(1).map((coefficient, index) => coefficient * (index + 1));
  }

  public getRootBound(coefficients: number[], tolerance: GeometryTolerance): number {
    const trimmedCoefficients = this.trim(coefficients, tolerance);
    const leadingCoefficient = Math.abs(trimmedCoefficients[trimmedCoefficients.length - 1] ?? 1);

    if (this.isZero(leadingCoefficient, tolerance)) {
      return 1;
    }

    const largestRatio = trimmedCoefficients
      .slice(0, -1)
      .reduce((maximum, coefficient) => Math.max(maximum, Math.abs(coefficient) / leadingCoefficient), 0);

    return 1 + largestRatio;
  }

  public deduplicateNumbers(values: number[], tolerance: number): number[] {
    return [...values]
      .sort((valueA, valueB) => valueA - valueB)
      .filter(
        (value, index, sortedValues) => index === 0 || Math.abs(value - (sortedValues[index - 1] ?? value)) > tolerance,
      );
  }

  public bisectRoot(coefficients: number[], start: number, end: number, tolerance: GeometryTolerance): number {
    let bracketStart = start;
    let bracketEnd = end;
    let startValue = this.getValue(coefficients, bracketStart);

    for (let iteration = 0; iteration < 96; iteration += 1) {
      const middle = (bracketStart + bracketEnd) / 2;
      const middleValue = this.getValue(coefficients, middle);

      if (this.isZero(middleValue, tolerance)) {
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

  public getRealRoots(coefficients: number[], tolerance: GeometryTolerance): number[] {
    return this.getRealRootResults(coefficients, tolerance).map((root) => root.value);
  }

  public getRealRootResults(coefficients: number[], tolerance: GeometryTolerance): PolynomialRoot[] {
    const trimmedCoefficients = this.trim(this.normalize(coefficients, tolerance), tolerance);
    const degree = trimmedCoefficients.length - 1;

    if (degree <= 0) {
      return [];
    }

    if (degree === 1) {
      const [constant = 0, linear = 0] = trimmedCoefficients;

      return this.isZero(linear, tolerance)
        ? []
        : [
            {
              isRepeated: false,
              value: -constant / linear,
            },
          ];
    }

    const bound = this.getRootBound(trimmedCoefficients, tolerance);
    const derivativeRoots = this.getRealRoots(this.getDerivative(trimmedCoefficients), tolerance).filter((root) =>
      this.isInsideRootBound(root, bound, tolerance),
    );
    const criticalPoints = this.deduplicateNumbers([-bound, ...derivativeRoots, bound], tolerance.parameter);
    const roots: PolynomialRoot[] = [];

    for (const criticalPoint of criticalPoints) {
      if (this.isZero(this.getValue(trimmedCoefficients, criticalPoint), tolerance)) {
        roots.push({
          isRepeated: true,
          value: criticalPoint,
        });
      }
    }

    for (let index = 0; index < criticalPoints.length - 1; index += 1) {
      const intervalStart = criticalPoints[index];
      const intervalEnd = criticalPoints[index + 1];

      const interval = this.getUsableInterval(intervalStart, intervalEnd, tolerance);

      if (!interval) {
        continue;
      }

      const intervalStartValue = this.getValue(trimmedCoefficients, interval.start);
      const intervalEndValue = this.getValue(trimmedCoefficients, interval.end);

      if (this.isZero(intervalStartValue, tolerance) || this.isZero(intervalEndValue, tolerance)) {
        continue;
      }

      if (this.hasSignChange(intervalStartValue, intervalEndValue)) {
        roots.push({
          isRepeated: false,
          value: this.bisectRoot(trimmedCoefficients, interval.start, interval.end, tolerance),
        });
      }
    }

    return this.deduplicateRootResults(roots, Math.sqrt(tolerance.parameter));
  }

  private deduplicateRootResults(roots: PolynomialRoot[], tolerance: number): PolynomialRoot[] {
    return [...roots]
      .sort((rootA, rootB) => rootA.value - rootB.value)
      .reduce<PolynomialRoot[]>((deduplicatedRoots, root) => {
        const previousRoot = deduplicatedRoots[deduplicatedRoots.length - 1];

        if (!previousRoot || Math.abs(root.value - previousRoot.value) > tolerance) {
          deduplicatedRoots.push(root);
          return deduplicatedRoots;
        }

        previousRoot.isRepeated ||= root.isRepeated;

        return deduplicatedRoots;
      }, []);
  }
}
