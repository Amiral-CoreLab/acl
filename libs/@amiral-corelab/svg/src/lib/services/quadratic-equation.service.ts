import { Singleton } from '@amiral-corelab/core';

export interface QuadraticEquationRoots {
  isTangent: boolean;
  roots: number[];
}

/**
 * Solves quadratic equations with tolerance-aware discriminant handling.
 */
@Singleton()
export class QuadraticEquationService {
  private isZero(value: number, tolerance: number): boolean {
    return Math.abs(value) <= tolerance;
  }

  private getDiscriminant(coefficientA: number, coefficientB: number, coefficientC: number): number {
    return coefficientB ** 2 - 4 * coefficientA * coefficientC;
  }

  private getDoubleRoot(coefficientA: number, coefficientB: number): number {
    return -coefficientB / (2 * coefficientA);
  }

  private getDistinctRoots(coefficientA: number, coefficientB: number, discriminant: number): number[] {
    const discriminantRoot = Math.sqrt(discriminant);

    return [
      (-coefficientB - discriminantRoot) / (2 * coefficientA),
      (-coefficientB + discriminantRoot) / (2 * coefficientA),
    ];
  }

  /**
   * Gets real roots for `a*x^2 + b*x + c = 0`.
   *
   * A near-zero discriminant is classified as a tangent root and returns one root. Negative
   * discriminants outside tolerance return no roots.
   *
   * @param coefficientA Quadratic coefficient.
   * @param coefficientB Linear coefficient.
   * @param coefficientC Constant coefficient.
   * @param tolerance Numeric tolerance used for near-zero checks.
   *
   * @returns Real roots and tangent classification.
   */
  public getRealRoots(
    coefficientA: number,
    coefficientB: number,
    coefficientC: number,
    tolerance: number,
  ): QuadraticEquationRoots {
    if (this.isZero(coefficientA, tolerance)) {
      return {
        isTangent: false,
        roots: [],
      };
    }

    const discriminant = this.getDiscriminant(coefficientA, coefficientB, coefficientC);

    if (discriminant < -tolerance) {
      return {
        isTangent: false,
        roots: [],
      };
    }

    if (this.isZero(discriminant, tolerance)) {
      return {
        isTangent: true,
        roots: [this.getDoubleRoot(coefficientA, coefficientB)],
      };
    }

    return {
      isTangent: false,
      roots: this.getDistinctRoots(coefficientA, coefficientB, discriminant),
    };
  }
}
