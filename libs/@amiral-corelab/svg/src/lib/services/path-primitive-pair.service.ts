import { getSingleton, Singleton } from '@amiral-corelab/core';
import { PathPrimitiveBoundingBoxService } from './path-primitive-bounding-box.service';
import { PathPrimitivePair, PathPrimitiveWithOrigin } from '../classes';
import type { PathPrimitive } from '../classes/path-primitive';

type PathPrimitivePairInput = PathPrimitive | PathPrimitiveWithOrigin;

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

  private getPrimitiveInputItem(input: PathPrimitivePairInput): PathPrimitiveWithOrigin {
    if (input instanceof PathPrimitiveWithOrigin) {
      return input;
    }

    return new PathPrimitiveWithOrigin({ primitive: input });
  }

  /**
   * Gets unique primitive pairs whose bounding boxes overlap.
   *
   * Each pair is returned once. A primitive is never paired with itself.
   *
   * @param inputs Primitives or primitive wrappers to compare.
   *
   * @returns Candidate pairs for exact intersection checks.
   */
  public getIntersectingBoundingBoxPairs(inputs: PathPrimitivePairInput[]): PathPrimitivePair[] {
    const items = inputs.map((input) => {
      const item = this.getPrimitiveInputItem(input);

      return {
        primitive: item.primitive,
        origin: input instanceof PathPrimitiveWithOrigin ? item.origin : undefined,
        boundingBox: this.pathPrimitiveBoundingBoxService.getBoundingBox(item.primitive),
      };
    });

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
