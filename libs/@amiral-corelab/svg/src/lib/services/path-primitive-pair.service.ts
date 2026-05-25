import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitiveOrigin, PathPrimitiveWithOrigin } from '../classes';
import { BoundingBox, PathPrimitivePair } from '../classes';
import { BoundingBoxFactory } from '../factories';
import { GeometryToleranceService } from './geometry-tolerance.service';
import type { PathPrimitive } from '../classes/path-primitive';

interface PathPrimitivePairItem {
  index: number;
  primitive: PathPrimitive;
  origin: PathPrimitiveOrigin;
  boundingBox: BoundingBox;
}

interface QuadTreeNode {
  bounds: BoundingBox;
  children: QuadTreeNode[];
  depth: number;
  items: PathPrimitivePairItem[];
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
  private readonly maximumQuadTreeDepth = 8;
  private readonly maximumQuadTreeNodeItems = 8;
  private readonly boundingBoxFactory = getSingleton(BoundingBoxFactory);
  private readonly geometryToleranceService = getSingleton(GeometryToleranceService);

  private getPairItem(input: PathPrimitiveWithOrigin, index: number): PathPrimitivePairItem {
    return {
      index,
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

  private createRootBounds(items: PathPrimitivePairItem[]): BoundingBox {
    return this.boundingBoxFactory.fromBoundingBoxes(items.map((item) => item.boundingBox));
  }

  private createQuadTreeNode(bounds: BoundingBox, depth: number): QuadTreeNode {
    return {
      bounds,
      children: [],
      depth,
      items: [],
    };
  }

  private createChildBounds(bounds: BoundingBox): BoundingBox[] {
    return [
      new BoundingBox(bounds.min.x, bounds.min.y, bounds.center.x, bounds.center.y),
      new BoundingBox(bounds.center.x, bounds.min.y, bounds.max.x, bounds.center.y),
      new BoundingBox(bounds.min.x, bounds.center.y, bounds.center.x, bounds.max.y),
      new BoundingBox(bounds.center.x, bounds.center.y, bounds.max.x, bounds.max.y),
    ];
  }

  private getContainingChild(node: QuadTreeNode, item: PathPrimitivePairItem): QuadTreeNode | undefined {
    return node.children.find((child) => child.bounds.contains(item.boundingBox));
  }

  private splitNode(node: QuadTreeNode): void {
    if (node.children.length > 0 || node.depth >= this.maximumQuadTreeDepth) {
      return;
    }

    node.children = this.createChildBounds(node.bounds).map((bounds) =>
      this.createQuadTreeNode(bounds, node.depth + 1),
    );
    const remainingItems: PathPrimitivePairItem[] = [];

    for (const item of node.items) {
      const child = this.getContainingChild(node, item);

      if (!child) {
        remainingItems.push(item);
        continue;
      }

      this.insertIntoQuadTree(child, item);
    }

    node.items = remainingItems;
  }

  private getPairKey(itemA: PathPrimitivePairItem, itemB: PathPrimitivePairItem): string {
    const minIndex = Math.min(itemA.index, itemB.index);
    const maxIndex = Math.max(itemA.index, itemB.index);

    return `${minIndex}:${maxIndex}`;
  }

  private insertIntoQuadTree(node: QuadTreeNode, item: PathPrimitivePairItem): void {
    const child = this.getContainingChild(node, item);

    if (child) {
      this.insertIntoQuadTree(child, item);
      return;
    }

    node.items.push(item);

    if (node.items.length > this.maximumQuadTreeNodeItems) {
      this.splitNode(node);
    }
  }

  private queryQuadTree(node: QuadTreeNode, item: PathPrimitivePairItem, candidates: PathPrimitivePairItem[]): void {
    if (!node.bounds.intersects(item.boundingBox)) {
      return;
    }

    candidates.push(...node.items);

    for (const child of node.children) {
      this.queryQuadTree(child, item, candidates);
    }
  }

  /**
   * Gets unique primitive pairs whose bounding boxes overlap.
   *
   * Each pair is returned once. A primitive is never paired with itself. Items are inserted
   * into a quadtree, then only primitives stored in intersecting tree nodes are checked for
   * exact box overlap.
   *
   * @param inputs Primitive wrappers to compare.
   *
   * @returns Candidate pairs for exact intersection checks.
   */
  public getIntersectingBoundingBoxPairs(inputs: PathPrimitiveWithOrigin[]): PathPrimitivePair[] {
    const items = inputs.map((input, index) => this.getPairItem(input, index));
    const pairs: PathPrimitivePair[] = [];
    const pairKeys = new Set<string>();

    if (items.length <= 1) {
      return [];
    }

    const root = this.createQuadTreeNode(this.createRootBounds(items), 0);

    for (const item of items) {
      const candidates: PathPrimitivePairItem[] = [];

      this.queryQuadTree(root, item, candidates);

      for (const candidate of candidates) {
        const pairKey = this.getPairKey(candidate, item);

        if (pairKeys.has(pairKey)) {
          continue;
        }

        pairKeys.add(pairKey);

        if (!candidate.boundingBox.intersects(item.boundingBox)) {
          continue;
        }

        pairs.push(this.createPair(candidate, item));
      }

      this.insertIntoQuadTree(root, item);
    }

    return pairs;
  }
}
