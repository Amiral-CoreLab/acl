import { assert } from '@amiral-corelab/core';
import { MatrixAnchorEnum } from '../enums';
import { radiansToDegreesUtil } from '../utils';

export class AclDomMatrix extends DOMMatrix {
  public static fromDOMMatrix(value: DOMMatrixReadOnly): AclDomMatrix {
    const { a, b, c, d, e, f } = value;

    return new AclDomMatrix([a, b, c, d, e, f]);
  }

  public static fromLocal(element: SVGGraphicsElement): AclDomMatrix {
    const { a, b, c, d, e, f } = element.transform.baseVal.consolidate()?.matrix ?? new DOMMatrix();

    return new AclDomMatrix([a, b, c, d, e, f]);
  }

  public static fromViewport(element: SVGGraphicsElement): AclDomMatrix {
    const matrix = element.getCTM();
    const ownerMatrix = element.ownerSVGElement?.getCTM();

    assert(matrix !== null, 'Element viewport matrix is unavailable');
    assert(ownerMatrix !== null, 'Element owner viewport matrix is unavailable');

    const { a, b, c, d, e, f } = matrix;

    return new AclDomMatrix([a, b, c, d, e, f]).multiply(ownerMatrix?.inverse());
  }

  public anchor = MatrixAnchorEnum.X;

  public get determinantValue(): number {
    const { a, b, c, d } = this;

    return a * d - b * c;
  }

  public get translationXValue(): number {
    return this.e;
  }

  public get translationYValue(): number {
    return this.f;
  }

  public get rotationValueRad(): number {
    const { a, b, c, d } = this;

    let res;

    switch (this.anchor) {
      case MatrixAnchorEnum.X:
        res = Math.atan2(b, a);
        break;
      case MatrixAnchorEnum.Y:
        res = Math.atan2(-c, d);
        break;
      default:
        throw new Error('Invalid anchor');
    }

    return res;
  }

  public get rotationValueDeg(): number {
    return radiansToDegreesUtil(this.rotationValueRad);
  }

  public get scaleXValue(): number {
    const { a, b } = this;

    let res;

    switch (this.anchor) {
      case MatrixAnchorEnum.X:
        res = Math.hypot(a, b);
        break;
      case MatrixAnchorEnum.Y:
        {
          const { scaleYValue, determinantValue } = this;

          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          if (scaleYValue === 0) {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            res = Math.hypot(a, b) * (determinantValue < 0 ? -1 : 1);
          } else {
            res = determinantValue / scaleYValue;
          }
        }
        break;
      default:
        throw new Error('Invalid anchor');
    }

    return res;
  }

  public get scaleYValue(): number {
    const { c, d } = this;

    let res;

    switch (this.anchor) {
      case MatrixAnchorEnum.X:
        {
          const { scaleXValue, determinantValue } = this;

          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          if (scaleXValue === 0) {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            res = Math.hypot(c, d) * (determinantValue < 0 ? -1 : 1);
          } else {
            res = determinantValue / scaleXValue;
          }
        }
        break;
      case MatrixAnchorEnum.Y:
        res = Math.hypot(c, d);
        break;
      default:
        throw new Error('Invalid anchor');
    }

    return res;
  }

  public get flipXValue(): number {
    let res;

    switch (this.anchor) {
      case MatrixAnchorEnum.X:
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        res = 1;
        break;
      case MatrixAnchorEnum.Y:
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        res = this.scaleXValue < 0 ? -1 : 1;
        break;
      default:
        throw new Error('Invalid anchor');
    }

    return res;
  }

  public get flipYValue(): number {
    let res;

    switch (this.anchor) {
      case MatrixAnchorEnum.X:
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        res = this.scaleYValue < 0 ? -1 : 1;
        break;
      case MatrixAnchorEnum.Y:
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        res = 1;
        break;
      default:
        throw new Error('Invalid anchor');
    }

    return res;
  }

  public override translate(tx?: number, ty?: number, tz?: number): AclDomMatrix {
    return AclDomMatrix.fromDOMMatrix(super.translate(tx, ty, tz));
  }

  public override scale(
    scaleX?: number,
    scaleY?: number,
    scaleZ?: number,
    originX?: number,
    originY?: number,
    originZ?: number,
  ): AclDomMatrix {
    return AclDomMatrix.fromDOMMatrix(super.scale(scaleX, scaleY, scaleZ, originX, originY, originZ));
  }

  public override multiply(other?: DOMMatrixInit): AclDomMatrix {
    return AclDomMatrix.fromDOMMatrix(super.multiply(other));
  }

  public override inverse(): AclDomMatrix {
    return AclDomMatrix.fromDOMMatrix(super.inverse());
  }

  public override rotate(rotX?: number, rotY?: number, rotZ?: number): AclDomMatrix {
    return AclDomMatrix.fromDOMMatrix(super.rotate(rotX, rotY, rotZ));
  }
}
