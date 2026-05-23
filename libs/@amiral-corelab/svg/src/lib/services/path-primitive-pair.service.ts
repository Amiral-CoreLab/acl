import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import { PathPrimitiveBoundingBoxService } from './path-primitive-bounding-box.service';
import { PathPrimitivePair } from '../classes';

@Singleton()
export class PathPrimitivePairService {
  private readonly pathPrimitiveBoundingBoxService = getSingleton(PathPrimitiveBoundingBoxService);

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
