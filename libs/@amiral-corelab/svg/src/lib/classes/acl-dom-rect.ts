import { assert } from '@amiral-corelab/core';
import { AclDomPoint } from './acl-dom-point';

export class AclDomRect extends DOMRect {
  public static fromDOMRect(value: DOMRectReadOnly): AclDomRect {
    const { x, y, width, height } = value;

    return new AclDomRect(x, y, width, height);
  }

  public static fromPoints(...points: DOMPointReadOnly[]): AclDomRect {
    const viewportXPoints = points.map((point) => point.x);
    const viewportYPoints = points.map((point) => point.y);
    const viewportMinX = Math.min(...viewportXPoints);
    const viewportMinY = Math.min(...viewportYPoints);
    const viewportMaxX = Math.max(...viewportXPoints);
    const viewportMaxY = Math.max(...viewportYPoints);

    return new AclDomRect(viewportMinX, viewportMinY, viewportMaxX - viewportMinX, viewportMaxY - viewportMinY);
  }

  public static fromLocal(element: SVGGraphicsElement): AclDomRect {
    const { x, y, width, height } = element.getBBox();

    return new AclDomRect(x, y, width, height);
  }

  public static fromViewport(element: SVGGraphicsElement): AclDomRect {
    const matrix = element.getCTM();

    assert(matrix !== null, 'Element viewport matrix is unavailable');

    const viewportPoints = AclDomRect.fromLocal(element).points.map((point) => point.matrixTransform(matrix));

    return AclDomRect.fromPoints(...viewportPoints);
  }

  public get center(): AclDomPoint {
    const { x, y, width, height } = this;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    return new AclDomPoint(x + width / 2, y + height / 2);
  }

  public get points(): [AclDomPoint, AclDomPoint, AclDomPoint, AclDomPoint] {
    return [
      new AclDomPoint(this.x, this.y),
      new AclDomPoint(this.x + this.width, this.y),
      new AclDomPoint(this.x + this.width, this.y + this.height),
      new AclDomPoint(this.x, this.y + this.height),
    ];
  }
}
