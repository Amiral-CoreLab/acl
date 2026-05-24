import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../classes/path-primitive';
import { BoundingBoxFactory } from '../factories';

export interface GeometryTolerance {
  distance: number;
  implicitEquation: number;
  parameter: number;
  scale: number;
}

/**
 * Computes numeric tolerances from the size of the primitives being compared.
 *
 * Geometry predicates need absolute tolerances in SVG user units, but a fixed value is too
 * strict for large coordinates and too loose for tiny shapes. This service derives a local
 * scale from primitive bounding boxes and keeps dimensionless predicates, such as normalized
 * parameters and implicit ellipse residuals, bounded by conservative minimums.
 */
@Singleton()
export class GeometryToleranceService {
  private readonly minimumDistanceTolerance = 1e-9;
  private readonly minimumImplicitEquationTolerance = 1e-7;
  private readonly minimumParameterTolerance = 1e-9;
  private readonly relativeDistanceTolerance = 1e-9;
  private readonly relativeImplicitEquationTolerance = 1e-12;
  private readonly boundingBoxFactory = getSingleton(BoundingBoxFactory);

  private getPrimitiveScale(primitive: PathPrimitive): number {
    const boundingBox = this.boundingBoxFactory.fromPrimitive(primitive);

    return Math.max(
      Math.abs(boundingBox.minX),
      Math.abs(boundingBox.minY),
      Math.abs(boundingBox.maxX),
      Math.abs(boundingBox.maxY),
      boundingBox.width,
      boundingBox.height,
      1,
    );
  }

  /**
   * Gets a tolerance set for one or more primitives.
   *
   * @param primitives Primitives involved in the same geometric predicate.
   *
   * @returns Scale-aware tolerances for the primitive set.
   */
  public fromPrimitives(...primitives: PathPrimitive[]): GeometryTolerance {
    const scale = Math.max(...primitives.map((primitive) => this.getPrimitiveScale(primitive)), 1);
    const distance = Math.max(this.minimumDistanceTolerance, scale * this.relativeDistanceTolerance);

    return {
      distance,
      implicitEquation: Math.max(this.minimumImplicitEquationTolerance, scale * this.relativeImplicitEquationTolerance),
      parameter: Math.max(this.minimumParameterTolerance, distance / scale),
      scale,
    };
  }
}
