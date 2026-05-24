import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { BoundingBox, PathPrimitiveOrigin, PathPrimitiveWithOrigin } from '../classes';
import { PathPrimitivePair } from '../classes';
import { BoundingBoxFactory } from '../factories';
import { GeometryToleranceService } from './geometry-tolerance.service';
import type { PathPrimitive } from '../classes/path-primitive';

interface PathPrimitivePairItem {
  index: number;
  primitive: PathPrimitive;
  origin: PathPrimitiveOrigin;
  boundingBox: BoundingBox;
}

interface SpatialGrid {
  cellCount: number;
  cellHeight: number;
  cellWidth: number;
  minX: number;
  minY: number;
}

interface SpatialGridRange {
  maxCellX: number;
  maxCellY: number;
  minCellX: number;
  minCellY: number;
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

  private createSpatialGrid(items: PathPrimitivePairItem[]): SpatialGrid {
    const minX = Math.min(...items.map((item) => item.boundingBox.minX));
    const minY = Math.min(...items.map((item) => item.boundingBox.minY));
    const maxX = Math.max(...items.map((item) => item.boundingBox.maxX));
    const maxY = Math.max(...items.map((item) => item.boundingBox.maxY));
    const cellCount = Math.max(1, Math.ceil(Math.sqrt(items.length)));

    return {
      cellCount,
      cellHeight: Math.max((maxY - minY) / cellCount, 1),
      cellWidth: Math.max((maxX - minX) / cellCount, 1),
      minX,
      minY,
    };
  }

  private clampCellIndex(cellIndex: number, grid: SpatialGrid): number {
    return Math.max(0, Math.min(grid.cellCount - 1, cellIndex));
  }

  private getGridRange(grid: SpatialGrid, item: PathPrimitivePairItem): SpatialGridRange {
    return {
      maxCellX: this.clampCellIndex(Math.floor((item.boundingBox.maxX - grid.minX) / grid.cellWidth), grid),
      maxCellY: this.clampCellIndex(Math.floor((item.boundingBox.maxY - grid.minY) / grid.cellHeight), grid),
      minCellX: this.clampCellIndex(Math.floor((item.boundingBox.minX - grid.minX) / grid.cellWidth), grid),
      minCellY: this.clampCellIndex(Math.floor((item.boundingBox.minY - grid.minY) / grid.cellHeight), grid),
    };
  }

  private getCellKey(cellX: number, cellY: number): string {
    return `${cellX}:${cellY}`;
  }

  private getPairKey(itemA: PathPrimitivePairItem, itemB: PathPrimitivePairItem): string {
    const minIndex = Math.min(itemA.index, itemB.index);
    const maxIndex = Math.max(itemA.index, itemB.index);

    return `${minIndex}:${maxIndex}`;
  }

  private addItemToGridCells(
    cells: Map<string, PathPrimitivePairItem[]>,
    grid: SpatialGrid,
    item: PathPrimitivePairItem,
  ): void {
    const range = this.getGridRange(grid, item);

    for (let cellX = range.minCellX; cellX <= range.maxCellX; cellX += 1) {
      for (let cellY = range.minCellY; cellY <= range.maxCellY; cellY += 1) {
        const cellKey = this.getCellKey(cellX, cellY);
        const cellItems = cells.get(cellKey) ?? [];

        cellItems.push(item);
        cells.set(cellKey, cellItems);
      }
    }
  }

  /**
   * Gets unique primitive pairs whose bounding boxes overlap.
   *
   * Each pair is returned once. A primitive is never paired with itself. Items are inserted
   * into a spatial grid, then only primitives sharing at least one cell are checked for exact
   * box overlap.
   *
   * @param inputs Primitive wrappers to compare.
   *
   * @returns Candidate pairs for exact intersection checks.
   */
  public getIntersectingBoundingBoxPairs(inputs: PathPrimitiveWithOrigin[]): PathPrimitivePair[] {
    const items = inputs.map((input, index) => this.getPairItem(input, index));
    const pairs: PathPrimitivePair[] = [];
    const pairKeys = new Set<string>();
    const cells = new Map<string, PathPrimitivePairItem[]>();

    if (items.length <= 1) {
      return [];
    }

    const grid = this.createSpatialGrid(items);

    for (const item of items) {
      const range = this.getGridRange(grid, item);

      for (let cellX = range.minCellX; cellX <= range.maxCellX; cellX += 1) {
        for (let cellY = range.minCellY; cellY <= range.maxCellY; cellY += 1) {
          const cellItems = cells.get(this.getCellKey(cellX, cellY)) ?? [];

          for (const cellItem of cellItems) {
            const pairKey = this.getPairKey(cellItem, item);

            if (pairKeys.has(pairKey)) {
              continue;
            }

            pairKeys.add(pairKey);

            if (!cellItem.boundingBox.intersects(item.boundingBox)) {
              continue;
            }

            pairs.push(this.createPair(cellItem, item));
          }
        }
      }

      this.addItemToGridCells(cells, grid, item);
    }

    return pairs;
  }
}
