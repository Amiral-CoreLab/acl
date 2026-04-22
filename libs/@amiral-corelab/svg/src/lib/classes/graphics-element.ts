import { assert } from '@amiral-corelab/core';
import { AclDomMatrix } from './acl-dom-matrix';
import { AclDomRect } from './acl-dom-rect';
import { AclDomPoint } from './acl-dom-point';

export class GraphicsElement {
  public readonly isSvg: boolean;
  public readonly element: SVGGraphicsElement;
  public readonly parentElement: SVGGraphicsElement;
  public readonly svgElement: SVGSVGElement;

  public constructor(node: Node) {
    assert(node instanceof SVGGraphicsElement, 'Element should be an SVGGraphicsElement');

    this.isSvg = node instanceof SVGSVGElement;
    this.element = node;

    if (node instanceof SVGSVGElement) {
      this.parentElement = node;
      this.svgElement = node;
    }

    const { parentElement, ownerSVGElement } = node;

    assert(parentElement instanceof SVGGraphicsElement, 'Parent element should be an SVGGraphicsElement');
    assert(ownerSVGElement instanceof SVGSVGElement, 'The element should be in an SVGSVGElement');

    this.parentElement = parentElement;
    this.svgElement = ownerSVGElement;
  }

  public get localBBox(): AclDomRect {
    return AclDomRect.fromLocal(this.element);
  }

  public get viewportBBox(): AclDomRect {
    return AclDomRect.fromViewport(this.element);
  }

  public get localMatrix(): AclDomMatrix {
    return AclDomMatrix.fromLocal(this.element);
  }

  public get viewportMatrix(): AclDomMatrix {
    return AclDomMatrix.fromViewport(this.element);
  }

  public get parentLocalBBox(): AclDomRect {
    return AclDomRect.fromLocal(this.parentElement);
  }

  public get parentViewportBBox(): AclDomRect {
    return AclDomRect.fromViewport(this.parentElement);
  }

  public get parentLocalMatrix(): AclDomMatrix {
    return AclDomMatrix.fromLocal(this.parentElement);
  }

  public get parentViewportMatrix(): AclDomMatrix {
    return AclDomMatrix.fromViewport(this.parentElement);
  }

  public get parentOrigin(): AclDomPoint {
    return new AclDomPoint().matrixTransform(this.parentViewportMatrix.inverse());
  }

  private setLocalMatrix(matrix: AclDomMatrix): void {
    this.element.setAttribute('transform', matrix.toString());
  }

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  private relativeTranslateInViewport(x = 0, y = 0): void {
    const deltaInParent = new AclDomPoint(x, y).matrixTransform(this.parentViewportMatrix.inverse());
    const nextTranslate = this.parentOrigin.deltaTo(deltaInParent);
    const nextMatrix = new AclDomMatrix().translate(nextTranslate.x, nextTranslate.y).multiply(this.localMatrix);

    this.setLocalMatrix(nextMatrix);
  }

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  public setPositionInViewport(x = 0, y = 0): this {
    const { viewportBBox } = this;
    const deltaInViewport = new AclDomPoint(viewportBBox.x, viewportBBox.y).deltaToXY(x, y);

    this.relativeTranslateInViewport(deltaInViewport.x, deltaInViewport.y);

    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  public setCenterInViewport(x = 0, y = 0): this {
    const delta = this.viewportBBox.center.deltaToXY(x, y);

    this.relativeTranslateInViewport(delta.x, delta.y);

    return this;
  }

  public setCenterInViewportTo(target: Node): this {
    const targetInstance = new GraphicsElement(target);

    assert(this.svgElement === targetInstance.svgElement, 'Element and target must be in the same SVG');

    const { x, y } = this.viewportBBox.center.deltaTo(targetInstance.viewportBBox.center);

    this.relativeTranslateInViewport(x, y);

    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  public setRotationInViewport(angle = 0, target?: Node): this {
    const targetInstance = target === undefined ? this : new GraphicsElement(target);

    assert(this.svgElement === targetInstance.svgElement, 'Element and target must be in the same SVG');

    const { center } = targetInstance.viewportBBox;

    const viewportRotationMatrix = new AclDomMatrix()
      .translate(center.x, center.y)
      .rotate(angle - this.viewportMatrix.rotationValueDeg)
      .translate(-center.x, -center.y);

    const { parentViewportMatrix } = this;

    const parentRotationMatrix = parentViewportMatrix
      .inverse()
      .multiply(viewportRotationMatrix)
      .multiply(parentViewportMatrix);

    const nextMatrix = parentRotationMatrix.multiply(this.localMatrix);

    this.setLocalMatrix(nextMatrix);

    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  public setScaleInViewport(x = 1, y = 1): this {
    const { center } = this.viewportBBox;
    const { scaleXValue, scaleYValue } = this.viewportMatrix;

    const viewportScaleMatrix = new AclDomMatrix()
      .translate(center.x, center.y)
      .scale(x / scaleXValue, y / scaleYValue)
      .translate(-center.x, -center.y);

    const { parentViewportMatrix } = this;

    const parentScaleMatrix = parentViewportMatrix
      .inverse()
      .multiply(viewportScaleMatrix)
      .multiply(parentViewportMatrix);

    this.setLocalMatrix(parentScaleMatrix.multiply(this.localMatrix));

    return this;
  }

  public setFlipInViewport(x = false, y = false): this {
    const { center } = this.viewportBBox;
    const { flipXValue, flipYValue } = this.viewportMatrix;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const targetFlipX = x ? -1 : 1;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const targetFlipY = y ? -1 : 1;

    const factorX = targetFlipX / flipXValue;
    const factorY = targetFlipY / flipYValue;

    const viewportFlipMatrix = new AclDomMatrix()
      .translate(center.x, center.y)
      .scale(factorX, factorY)
      .translate(-center.x, -center.y);

    const { parentViewportMatrix } = this;
    const parentFlipMatrix = parentViewportMatrix.inverse().multiply(viewportFlipMatrix).multiply(parentViewportMatrix);

    this.setLocalMatrix(parentFlipMatrix.multiply(this.localMatrix));

    return this;
  }

  public resetTransformInViewport(): this {
    const { center: viewportCenter } = this.viewportBBox;
    const { center: localCenter } = this.localBBox;

    const viewportResetMatrix = new AclDomMatrix()
      .translate(viewportCenter.x, viewportCenter.y)
      .translate(-localCenter.x, -localCenter.y);

    this.setLocalMatrix(this.parentViewportMatrix.inverse().multiply(viewportResetMatrix));

    return this;
  }
}
