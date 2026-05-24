import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { Point } from '../classes';
import type { BoundingBox } from '../classes/bounding-box';
import type { PathPrimitive } from '../classes/path-primitive';
import { BoundingBoxFactory } from '../factories';

export interface GeometryTolerance {
  angle: number;
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
  private readonly minimumAngleTolerance = 1e-9;
  private readonly minimumDistanceTolerance = 1e-9;
  private readonly minimumImplicitEquationTolerance = 1e-7;
  private readonly minimumParameterTolerance = 1e-9;
  private readonly relativeDistanceTolerance = 1e-9;
  private readonly relativeImplicitEquationTolerance = 1e-12;
  private readonly boundingBoxFactory = getSingleton(BoundingBoxFactory);

  private getBoundingBoxScale(boundingBox: BoundingBox): number {
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

  private getPrimitiveScale(primitive: PathPrimitive): number {
    return this.getBoundingBoxScale(this.boundingBoxFactory.fromPrimitive(primitive));
  }

  private fromScale(scale: number): GeometryTolerance {
    const distance = Math.max(this.minimumDistanceTolerance, scale * this.relativeDistanceTolerance);

    return {
      angle: this.minimumAngleTolerance,
      distance,
      implicitEquation: Math.max(this.minimumImplicitEquationTolerance, scale * this.relativeImplicitEquationTolerance),
      parameter: Math.max(this.minimumParameterTolerance, distance / scale),
      scale,
    };
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

    return this.fromScale(scale);
  }

  /**
   * Gets a tolerance set for geometry that is still described by source points.
   *
   * This is used before drawable primitives exist, for example while resolving a rounded
   * vertex from its previous/current/next path vertices.
   *
   * @param points Points involved in the same geometric predicate.
   *
   * @returns Scale-aware tolerances for the point set.
   */
  public fromPoints(...points: Point[]): GeometryTolerance {
    return this.fromScale(this.getBoundingBoxScale(this.boundingBoxFactory.fromPoints(points)));
  }
}
