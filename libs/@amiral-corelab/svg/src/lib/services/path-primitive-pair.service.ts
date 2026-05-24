import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { BoundingBox, PathPrimitiveOrigin, PathPrimitiveWithOrigin } from '../classes';
import { PathPrimitivePair } from '../classes';
import { BoundingBoxFactory } from '../factories';
import { GeometryToleranceService } from './geometry-tolerance.service';
import type { PathPrimitive } from '../classes/path-primitive';

interface PathPrimitivePairItem {
  primitive: PathPrimitive;
  origin: PathPrimitiveOrigin;
  boundingBox: BoundingBox;
}

/**
 * Builds candidate primitive pairs for exact geometry operations.
 *
 * The service first computes primitive bounding boxes and only keeps pairs whose boxes
 * overlap. This avoids running expensive exact intersection calculations for primitives
 * that cannot intersect.
 */
@Singleton()
export class PathPrimitivePairService {
  private readonly boundingBoxFactory = getSingleton(BoundingBoxFactory);
  private readonly geometryToleranceService = getSingleton(GeometryToleranceService);

  private getPairItem(input: PathPrimitiveWithOrigin): PathPrimitivePairItem {
    return {
      primitive: input.primitive,
      origin: input.origin,
      boundingBox: this.boundingBoxFactory
        .fromPrimitive(input.primitive)
        .inflate(this.geometryToleranceService.fromPrimitives(input.primitive).distance),
    };
  }

  private createPair(itemA: PathPrimitivePairItem, itemB: PathPrimitivePairItem): PathPrimitivePair {
    return new PathPrimitivePair({
      primitiveA: itemA.primitive,
      primitiveB: itemB.primitive,
      originA: itemA.origin,
      originB: itemB.origin,
    });
  }

  /**
   * Gets unique primitive pairs whose bounding boxes overlap.
   *
   * Each pair is returned once. A primitive is never paired with itself. Items are processed
   * with a sweep-line over bounding-box `minX`, so primitives whose boxes have already ended
   * on the x-axis are removed before overlap checks.
   *
   * @param inputs Primitive wrappers to compare.
   *
   * @returns Candidate pairs for exact intersection checks.
   */
  public getIntersectingBoundingBoxPairs(inputs: PathPrimitiveWithOrigin[]): PathPrimitivePair[] {
    const items = inputs
      .map((input) => this.getPairItem(input))
      .sort((itemA, itemB) => itemA.boundingBox.minX - itemB.boundingBox.minX);
    let activeItems: PathPrimitivePairItem[] = [];
    const pairs: PathPrimitivePair[] = [];

    for (const item of items) {
      activeItems = activeItems.filter((activeItem) => activeItem.boundingBox.maxX >= item.boundingBox.minX);

      for (const activeItem of activeItems) {
        if (!activeItem.boundingBox.intersects(item.boundingBox)) {
          continue;
        }

        pairs.push(this.createPair(activeItem, item));
      }

      activeItems.push(item);
    }

    return pairs;
  }
}
