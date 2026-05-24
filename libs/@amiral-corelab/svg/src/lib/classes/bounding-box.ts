import type { InitArg } from '@amiral-corelab/core';

export interface BoundingBoxInit {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Represents an axis-aligned bounding box in the SVG user coordinate system.
 *
 * SVG exposes element bounding boxes with an origin and a size. In this class the origin is
 * stored as `minX` and `minY`, and the opposite corner is stored as `maxX` and `maxY`.
 * `width` and `height` are derived from those two corners.
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
  public get width(): number {
    return this.maxX - this.minX;
  }

  /**
   * Vertical size of the bounding box.
   */
  public get height(): number {
    return this.maxY - this.minY;
  }

  /**
   * Computes a numeric scale from a bounding box.
   *
   * The scale includes absolute coordinates and box dimensions so tolerance policies can
   * adapt both to large SVG user coordinates and to large local geometry.
   *
   * @returns Positive scale, with `1` as the minimum.
   */
  public get scale(): number {
    return Math.max(
      Math.abs(this.minX),
      Math.abs(this.minY),
      Math.abs(this.maxX),
      Math.abs(this.maxY),
      this.width,
      this.height,
      1,
    );
  }

  /**
   * Creates a bounding box from optional bound values.
   *
   * Width and height are derived from the minimum and maximum coordinates.
   *
   * @param initArg Source bounding box values.
   */
  public constructor(initArg?: InitArg<BoundingBoxInit>) {
    this.minX = initArg?.minX ?? 0;
    this.minY = initArg?.minY ?? 0;
    this.maxX = initArg?.maxX ?? 0;
    this.maxY = initArg?.maxY ?? 0;
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
}
