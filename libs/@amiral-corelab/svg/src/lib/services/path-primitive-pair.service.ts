import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import { PathPrimitiveBoundingBoxService } from './path-primitive-bounding-box.service';
import { PathPrimitivePair } from '../classes';

/**
 * Builds candidate primitive pairs for exact geometry operations.
 *
 * The service first computes primitive bounding boxes and only keeps pairs whose boxes
 * overlap. This avoids running expensive exact intersection calculations for primitives
 * that cannot intersect.
 */
@Singleton()
export class PathPrimitivePairService {
  private readonly pathPrimitiveBoundingBoxService = getSingleton(PathPrimitiveBoundingBoxService);

  /**
   * Gets unique primitive pairs whose bounding boxes overlap.
   *
   * Each pair is returned once. A primitive is never paired with itself.
   *
   * @param primitives Primitives to compare.
   *
   * @returns Candidate pairs for exact intersection checks.
   */
  public getIntersectingBoundingBoxPairs(primitives: PathPrimitive[]): PathPrimitivePair[] {
    const items = primitives.map((primitive) => ({
      primitive,
      boundingBox: this.pathPrimitiveBoundingBoxService.getBoundingBox(primitive),
    }));

    const pairs: PathPrimitivePair[] = [];

    for (let indexA = 0; indexA < items.length; indexA += 1) {
      for (let indexB = indexA + 1; indexB < items.length; indexB += 1) {
        const itemA = items[indexA];
        const itemB = items[indexB];

        if (!itemA || !itemB) {
          continue;
        }

        if (!itemA.boundingBox.intersects(itemB.boundingBox)) {
          continue;
        }

        pairs.push(
          new PathPrimitivePair({
            primitiveA: itemA.primitive,
            primitiveB: itemB.primitive,
          }),
        );
      }
    }

    return pairs;
  }
}
