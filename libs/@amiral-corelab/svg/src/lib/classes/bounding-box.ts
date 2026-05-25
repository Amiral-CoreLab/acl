import { Point } from './point';

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
  public readonly min: Point;
  public readonly max: Point;
  public readonly width: number;
  public readonly height: number;
  public readonly center: Point;
  public readonly scale: number;

  /**
   * Creates a bounding box from optional bound values.
   *
   * Width and height are derived from the minimum and maximum coordinates.
   *
   * @param minX
   * @param minY
   * @param maxX
   * @param maxY
   */
  public constructor(minX = 0, minY = 0, maxX = 0, maxY = 0) {
    this.min = new Point(minX, minY);
    this.max = new Point(maxX, maxY);
    this.width = maxX - minX;
    this.height = maxY - minY;
    this.center = new Point((minX + maxX) / 2, (minY + maxY) / 2);
    this.scale = Math.max(Math.abs(minX), Math.abs(minY), Math.abs(maxX), Math.abs(maxY), this.width, this.height, 1);
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
      this.min.x <= boundingBox.max.x &&
      this.max.x >= boundingBox.min.x &&
      this.min.y <= boundingBox.max.y &&
      this.max.y >= boundingBox.min.y
    );
  }

  /**
   * Tests whether this box fully contains another axis-aligned bounding box.
   *
   * @param boundingBox Bounding box that should be contained by this one.
   *
   * @returns Whether every side of the other box lies inside this box.
   */
  public contains(boundingBox: BoundingBox): boolean {
    return (
      this.min.x <= boundingBox.min.x &&
      this.max.x >= boundingBox.max.x &&
      this.min.y <= boundingBox.min.y &&
      this.max.y >= boundingBox.max.y
    );
  }

  /**
   * Creates a box expanded by the same distance on every side.
   *
   * Inflation is useful before broad-phase comparisons so tiny floating point drift around
   * primitive bounds does not reject pairs that exact geometry checks should still inspect.
   *
   * @param distance Distance to add around the box.
   *
   * @returns Inflated bounding box.
   */
  public inflate(distance: number): BoundingBox {
    if (!Number.isFinite(distance) || distance <= 0) {
      return new BoundingBox(this.min.x, this.min.y, this.max.x, this.max.y);
    }

    return new BoundingBox(this.min.x - distance, this.min.y - distance, this.max.x + distance, this.max.y + distance);
  }
}
