import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveWithOrigin } from '../classes';
import { PathPrimitivePair } from '../classes';
import { BoundingBoxFactory } from '../factories';

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

  /**
   * Gets unique primitive pairs whose bounding boxes overlap.
   *
   * Each pair is returned once. A primitive is never paired with itself.
   *
   * @param inputs Primitive wrappers to compare.
   *
   * @returns Candidate pairs for exact intersection checks.
   */
  public getIntersectingBoundingBoxPairs(inputs: PathPrimitiveWithOrigin[]): PathPrimitivePair[] {
    const items = inputs.map((input) => ({
      primitive: input.primitive,
      origin: input.origin,
      boundingBox: this.boundingBoxFactory.fromPrimitive(input.primitive),
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
            originA: itemA.origin,
            originB: itemB.origin,
          }),
        );
      }
    }

    return pairs;
  }
}
