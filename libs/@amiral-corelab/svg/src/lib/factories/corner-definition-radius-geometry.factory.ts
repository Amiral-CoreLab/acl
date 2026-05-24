import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { CornerVertices } from '../classes';
import { CornerDefinitionRadiusGeometry, Vector } from '../classes';
import type { Operation } from '../stores';
import { OperationStore } from '../stores';

@Singleton()
export class CornerDefinitionRadiusGeometryFactory {
  private readonly operationStore = getSingleton(OperationStore);

  private readonly epsilon = 1e-9;

  /**
   * Computes radius corner geometry from the previous, current, and next path vertices.
   *
   * The calculation follows the standard rounded-corner construction: vectors are built from
   * the corner point to its neighboring points, the corner angle is measured between those
   * vectors, and the radius is converted to tangent points along both adjacent edges.
   *
   * SVG rounded rectangles expose the same radius idea through `rx` and `ry`; SVG arc
   * implementation notes use vector angles as the basis for arc parameter conversion.
   *
   * @param cornerVertices Previous, current, and next vertices around the corner.
   *
   * @returns Computed radius geometry.
   *
   * @see https://www.w3.org/TR/SVG/shapes.html#RectElement
   * @see https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
   */
  public fromCornerVertices(cornerVertices: CornerVertices): Operation<CornerDefinitionRadiusGeometry> {
    const { previous, current, next } = cornerVertices;
    const { cornerDefinition } = current;

    if (!(cornerDefinition instanceof CornerDefinitionRadiusGeometry)) {
      return this.operationStore.warn('Current vertex corner definition must be radius-based.');
    }

    if (cornerDefinition.radius <= 0) {
      return this.operationStore.warn('Corner radius must be greater than zero.');
    }

    // 1. Build the two edge directions around the corner.
    const incomingVector = Vector.fromPoints(current, previous);
    const outgoingVector = Vector.fromPoints(current, next);

    if (incomingVector.getLength() <= 0) {
      return this.operationStore.warn('Incoming edge must have a positive length.');
    }

    if (outgoingVector.getLength() <= 0) {
      return this.operationStore.warn('Incoming edge must have a positive length.');
    }

    // 2. Normalize directions so dot/cross products describe only angle and orientation.
    const incomingUnitVector = incomingVector.normalize();
    const outgoingUnitVector = outgoingVector.normalize();

    // 3. Compute the corner angle. Clamp avoids NaN from floating point drift around [-1, 1].
    const cornerAngle = incomingVector.getUnsignedAngleTo(outgoingVector);

    if (cornerAngle <= this.epsilon) {
      return this.operationStore.warn('Incoming and outgoing edges must not have the same direction.');
    }

    if (Math.abs(Math.PI - cornerAngle) <= this.epsilon) {
      return this.operationStore.warn('Incoming and outgoing edges must not be opposite directions.');
    }

    // 4. Convert the requested radius to the tangent offset along both adjacent edges.
    const halfAngleTangent = Math.tan(cornerAngle / 2);
    const tangentOffset = cornerDefinition.radius / halfAngleTangent;

    if (!Number.isFinite(halfAngleTangent) || !Number.isFinite(tangentOffset) || tangentOffset <= 0) {
      return this.operationStore.warn('Corner radius and angle must produce a valid tangent offset.');
    }

    return this.operationStore.success(
      new CornerDefinitionRadiusGeometry({
        previousPoint: previous,
        currentPoint: current,
        nextPoint: next,
        radius: cornerDefinition.radius,
        incomingVector,
        outgoingVector,
        incomingUnitVector,
        outgoingUnitVector,
        cornerAngle,
        halfAngleTangent,
        tangentOffset,
      }),
    );
  }
}
