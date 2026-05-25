import { Singleton } from '@amiral-corelab/core';
import type { GeometryTolerance } from './geometry-tolerance.service';

/**
 * Provides tolerance-aware helpers for real polynomial equations.
 *
 * Coefficients are stored in ascending degree order: `[constant, x, x^2, ...]`.
 */
@Singleton()
export class PolynomialEquationService {
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

    if (largestCoefficient <= tolerance.implicitEquation) {
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

    if (leadingCoefficient <= tolerance.implicitEquation) {
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

      if (Math.abs(middleValue) <= tolerance.implicitEquation) {
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
    const trimmedCoefficients = this.trim(this.normalize(coefficients, tolerance), tolerance);
    const degree = trimmedCoefficients.length - 1;

    if (degree <= 0) {
      return [];
    }

    if (degree === 1) {
      const [constant = 0, linear = 0] = trimmedCoefficients;

      return Math.abs(linear) <= tolerance.implicitEquation ? [] : [-constant / linear];
    }

    const bound = this.getRootBound(trimmedCoefficients, tolerance);
    const derivativeRoots = this.getRealRoots(this.getDerivative(trimmedCoefficients), tolerance).filter(
      (root) => root >= -bound - tolerance.parameter && root <= bound + tolerance.parameter,
    );
    const criticalPoints = this.deduplicateNumbers([-bound, ...derivativeRoots, bound], tolerance.parameter);
    const roots: number[] = [];

    for (const criticalPoint of criticalPoints) {
      if (Math.abs(this.getValue(trimmedCoefficients, criticalPoint)) <= tolerance.implicitEquation) {
        roots.push(criticalPoint);
      }
    }

    for (let index = 0; index < criticalPoints.length - 1; index += 1) {
      const intervalStart = criticalPoints[index];
      const intervalEnd = criticalPoints[index + 1];

      if (
        intervalStart === undefined ||
        intervalEnd === undefined ||
        Math.abs(intervalEnd - intervalStart) <= tolerance.parameter
      ) {
        continue;
      }

      const intervalStartValue = this.getValue(trimmedCoefficients, intervalStart);
      const intervalEndValue = this.getValue(trimmedCoefficients, intervalEnd);

      if (
        Math.abs(intervalStartValue) <= tolerance.implicitEquation ||
        Math.abs(intervalEndValue) <= tolerance.implicitEquation
      ) {
        continue;
      }

      if (intervalStartValue * intervalEndValue < 0) {
        roots.push(this.bisectRoot(trimmedCoefficients, intervalStart, intervalEnd, tolerance));
      }
    }

    return this.deduplicateNumbers(roots, Math.sqrt(tolerance.parameter));
  }
}
