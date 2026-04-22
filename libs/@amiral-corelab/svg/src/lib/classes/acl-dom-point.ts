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
