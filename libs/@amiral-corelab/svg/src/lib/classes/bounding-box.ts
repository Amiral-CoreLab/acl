import type { InitArg } from '@amiral-corelab/core';

/**
 * Represents an axis-aligned bounding box in the SVG user coordinate system.
 *
 * SVG exposes element bounding boxes with an origin and a size. In this class the origin is
 * stored as `minX` and `minY`, and the opposite corner is stored as `maxX` and `maxY`.
 * `width` and `height` describe the size between those two corners.
 *
 * These bounds are useful for broad-phase geometry checks, such as quickly rejecting path
 * primitives whose boxes do not overlap.
 *
 * @see https://www.w3.org/TR/SVG2/coords.html
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
 */
export class BoundingBox {
  /**
   * Minimum horizontal coordinate of the box.
   */
  public readonly minX: number;

  /**
   * Minimum vertical coordinate of the box.
   */
  public readonly minY: number;

  /**
   * Maximum horizontal coordinate of the box.
   */
  public readonly maxX: number;

  /**
   * Maximum vertical coordinate of the box.
   */
  public readonly maxY: number;

  /**
   * Horizontal size of the bounding box.
   */
  public readonly width: number;

  /**
   * Vertical size of the bounding box.
   */
  public readonly height: number;

  /**
   * Creates a bounding box from optional bound and size values.
   *
   * Prefer `BoundingBox.fromMinMax()` when creating a box from two corners so `width` and
   * `height` are derived consistently.
   *
   * @param initArg Source bounding box values.
   */
  public constructor(initArg?: InitArg<BoundingBox>) {
    this.minX = initArg?.minX ?? 0;
    this.minY = initArg?.minY ?? 0;
    this.maxX = initArg?.maxX ?? 0;
    this.maxY = initArg?.maxY ?? 0;
    this.width = initArg?.width ?? 0;
    this.height = initArg?.height ?? 0;
  }

  /**
   * Tests whether this box overlaps another axis-aligned bounding box.
   *
   * This is a broad-phase geometry check: intersecting boxes only mean the enclosed
   * geometry may intersect and still needs an exact primitive intersection test.
   *
   * @param boundingBox Bounding box to compare with this one.
   *
   * @returns Whether the two boxes overlap or touch.
   */
  public intersects(boundingBox: BoundingBox): boolean {
    return (
      this.minX <= boundingBox.maxX &&
      this.maxX >= boundingBox.minX &&
      this.minY <= boundingBox.maxY &&
      this.maxY >= boundingBox.minY
    );
  }

  /**
   * Creates a bounding box from its minimum and maximum coordinates.
   *
   * This factory derives `width` and `height` from the provided bounds, keeping the box
   * values consistent in one place.
   *
   * @param minX Minimum horizontal coordinate.
   * @param minY Minimum vertical coordinate.
   * @param maxX Maximum horizontal coordinate.
   * @param maxY Maximum vertical coordinate.
   *
   * @returns Bounding box spanning the provided bounds.
   */
  public static fromMinMax(minX: number, minY: number, maxX: number, maxY: number): BoundingBox {
    return new BoundingBox({ minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY });
  }
}
