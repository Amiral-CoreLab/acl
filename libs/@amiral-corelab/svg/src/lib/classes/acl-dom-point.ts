/**
 * FR: Représente un point DOM/SVG avec des helpers de delta et de transformation.
 * EN: Represents a DOM/SVG point with delta and transform helpers.
 */
export class AclDomPoint extends DOMPoint {
  public static fromDOMPoint(value: DOMPointReadOnly): AclDomPoint {
    const { x, y } = value;

    return new AclDomPoint(x, y);
  }

  public deltaTo(target: DOMPointReadOnly): AclDomPoint {
    return new AclDomPoint(target.x - this.x, target.y - this.y);
  }

  public deltaToXY(x: number, y: number): AclDomPoint {
    return new AclDomPoint(x - this.x, y - this.y);
  }

  public override matrixTransform(matrix?: DOMMatrixInit): AclDomPoint {
    return AclDomPoint.fromDOMPoint(super.matrixTransform(matrix));
  }
}
