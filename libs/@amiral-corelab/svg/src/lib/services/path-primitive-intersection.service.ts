import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import { CornerDefinitionArcCenter, PathPrimitiveIntersection, Point, Segment } from '../classes';
import { PathPrimitivePairService } from './path-primitive-pair.service';
import { ArcCenterGeometryService } from './arc-center-geometry.service';

@Singleton()
export class PathPrimitiveIntersectionService {
  private readonly epsilon = 1e-9;
  private readonly arcIntersectionSampleAngle = Math.PI / 64;
  private readonly pathPrimitivePairService = getSingleton(PathPrimitivePairService);
  private readonly arcCenterGeometryService = getSingleton(ArcCenterGeometryService);

  private getSegmentSegmentIntersections(segmentA: Segment, segmentB: Segment): PathPrimitiveIntersection[] {
    const vectorA = segmentA.start.getVectorTo(segmentA.end);
    const vectorB = segmentB.start.getVectorTo(segmentB.end);
    const startOffset = segmentA.start.getVectorTo(segmentB.start);
    const denominator = vectorA.x * vectorB.y - vectorA.y * vectorB.x;

    if (Math.abs(denominator) <= this.epsilon) {
      return [];
    }

    const parameterA = (startOffset.x * vectorB.y - startOffset.y * vectorB.x) / denominator;
    const parameterB = (startOffset.x * vectorA.y - startOffset.y * vectorA.x) / denominator;

    if (
      parameterA < -this.epsilon ||
      parameterA > 1 + this.epsilon ||
      parameterB < -this.epsilon ||
      parameterB > 1 + this.epsilon
    ) {
      return [];
    }

    const clampedParameterA = Math.max(0, Math.min(1, parameterA));
    const clampedParameterB = Math.max(0, Math.min(1, parameterB));
    const point = new Point({
      x: segmentA.start.x + vectorA.x * clampedParameterA,
      y: segmentA.start.y + vectorA.y * clampedParameterA,
    });

    return [
      new PathPrimitiveIntersection({
        point,
        primitiveA: segmentA,
        primitiveB: segmentB,
        parameterA: clampedParameterA,
        parameterB: clampedParameterB,
      }),
    ];
  }

  private getPointInArcLocalCoordinates(point: Point, arc: CornerDefinitionArcCenter): Point {
    const cosRotation = Math.cos(arc.axisRotation);
    const sinRotation = Math.sin(arc.axisRotation);
    const x = point.x - arc.center.x;
    const y = point.y - arc.center.y;

    return new Point({
      x: cosRotation * x + sinRotation * y,
      y: -sinRotation * x + cosRotation * y,
    });
  }

  private getPointEllipseValue(point: Point, arc: CornerDefinitionArcCenter): number {
    const localPoint = this.getPointInArcLocalCoordinates(point, arc);

    return localPoint.x ** 2 / arc.radiusX ** 2 + localPoint.y ** 2 / arc.radiusY ** 2 - 1;
  }

  private getPointAngleOnArc(point: Point, arc: CornerDefinitionArcCenter): number {
    const localPoint = this.getPointInArcLocalCoordinates(point, arc);

    return Math.atan2(localPoint.y / arc.radiusY, localPoint.x / arc.radiusX);
  }

  private getSegmentArcIntersections(
    segment: Segment,
    arc: CornerDefinitionArcCenter,
    reversePrimitiveOrder = false,
  ): PathPrimitiveIntersection[] {
    if (arc.radiusX === 0 || arc.radiusY === 0) {
      return [];
    }

    const start = this.getPointInArcLocalCoordinates(segment.start, arc);
    const end = this.getPointInArcLocalCoordinates(segment.end, arc);
    const direction = start.getVectorTo(end);
    const radiusXSquared = arc.radiusX ** 2;
    const radiusYSquared = arc.radiusY ** 2;
    const quadraticA = direction.x ** 2 / radiusXSquared + direction.y ** 2 / radiusYSquared;
    const quadraticB = 2 * ((start.x * direction.x) / radiusXSquared + (start.y * direction.y) / radiusYSquared);
    const quadraticC = start.x ** 2 / radiusXSquared + start.y ** 2 / radiusYSquared - 1;
    const discriminant = quadraticB ** 2 - 4 * quadraticA * quadraticC;

    if (quadraticA === 0 || discriminant < -this.epsilon) {
      return [];
    }

    const segmentParameters =
      Math.abs(discriminant) <= this.epsilon
        ? [-quadraticB / (2 * quadraticA)]
        : [
            (-quadraticB - Math.sqrt(discriminant)) / (2 * quadraticA),
            (-quadraticB + Math.sqrt(discriminant)) / (2 * quadraticA),
          ];

    return segmentParameters.flatMap((segmentParameter) => {
      if (segmentParameter < -this.epsilon || segmentParameter > 1 + this.epsilon) {
        return [];
      }

      const clampedSegmentParameter = Math.max(0, Math.min(1, segmentParameter));
      const localPoint = new Point({
        x: start.x + direction.x * clampedSegmentParameter,
        y: start.y + direction.y * clampedSegmentParameter,
      });
      const angle = Math.atan2(localPoint.y / arc.radiusY, localPoint.x / arc.radiusX);

      if (!this.arcCenterGeometryService.isAngleOnArc(angle, arc.startAngle, arc.deltaAngle)) {
        return [];
      }

      const arcParameter = this.arcCenterGeometryService.getAngleParameterOnArc(angle, arc);
      const point = new Point({
        x: segment.start.x + (segment.end.x - segment.start.x) * clampedSegmentParameter,
        y: segment.start.y + (segment.end.y - segment.start.y) * clampedSegmentParameter,
      });

      return [
        new PathPrimitiveIntersection({
          point,
          primitiveA: reversePrimitiveOrder ? arc : segment,
          primitiveB: reversePrimitiveOrder ? segment : arc,
          parameterA: reversePrimitiveOrder ? arcParameter : clampedSegmentParameter,
          parameterB: reversePrimitiveOrder ? clampedSegmentParameter : arcParameter,
        }),
      ];
    });
  }

  private getArcArcIntersections(
    arcA: CornerDefinitionArcCenter,
    arcB: CornerDefinitionArcCenter,
  ): PathPrimitiveIntersection[] {
    if (arcA.radiusX === 0 || arcA.radiusY === 0 || arcB.radiusX === 0 || arcB.radiusY === 0) {
      return [];
    }

    const sampleCount = Math.max(16, Math.ceil(Math.abs(arcA.deltaAngle) / this.arcIntersectionSampleAngle));
    const intersections: PathPrimitiveIntersection[] = [];

    for (let index = 0; index < sampleCount; index += 1) {
      const parameterStart = index / sampleCount;
      const parameterEnd = (index + 1) / sampleCount;
      const angleStart = arcA.startAngle + arcA.deltaAngle * parameterStart;
      const angleEnd = arcA.startAngle + arcA.deltaAngle * parameterEnd;
      const valueStart = this.getPointEllipseValue(arcA.getPointAtAngle(angleStart), arcB);
      const valueEnd = this.getPointEllipseValue(arcA.getPointAtAngle(angleEnd), arcB);

      if (Math.abs(valueStart) <= this.epsilon) {
        intersections.push(...this.createArcArcIntersections(arcA, arcB, angleStart));
      }

      if (valueStart * valueEnd > 0) {
        continue;
      }

      intersections.push(
        ...this.createArcArcIntersections(
          arcA,
          arcB,
          this.findArcArcIntersectionAngle(arcA, arcB, angleStart, angleEnd),
        ),
      );
    }

    const endAngle = arcA.startAngle + arcA.deltaAngle;

    if (Math.abs(this.getPointEllipseValue(arcA.getPointAtAngle(endAngle), arcB)) <= this.epsilon) {
      intersections.push(...this.createArcArcIntersections(arcA, arcB, endAngle));
    }

    return this.deduplicateIntersections(intersections);
  }

  private findArcArcIntersectionAngle(
    arcA: CornerDefinitionArcCenter,
    arcB: CornerDefinitionArcCenter,
    angleStart: number,
    angleEnd: number,
  ): number {
    let start = angleStart;
    let end = angleEnd;
    let startValue = this.getPointEllipseValue(arcA.getPointAtAngle(start), arcB);

    for (let iteration = 0; iteration < 64; iteration += 1) {
      const middle = (start + end) / 2;
      const middleValue = this.getPointEllipseValue(arcA.getPointAtAngle(middle), arcB);

      if (Math.abs(middleValue) <= this.epsilon) {
        return middle;
      }

      if (startValue * middleValue <= 0) {
        end = middle;
      } else {
        start = middle;
        startValue = middleValue;
      }
    }

    return (start + end) / 2;
  }

  private createArcArcIntersections(
    arcA: CornerDefinitionArcCenter,
    arcB: CornerDefinitionArcCenter,
    angleA: number,
  ): PathPrimitiveIntersection[] {
    const point = arcA.getPointAtAngle(angleA);
    const angleB = this.getPointAngleOnArc(point, arcB);

    if (!this.arcCenterGeometryService.isAngleOnArc(angleB, arcB.startAngle, arcB.deltaAngle)) {
      return [];
    }

    return [
      new PathPrimitiveIntersection({
        point,
        primitiveA: arcA,
        primitiveB: arcB,
        parameterA: this.arcCenterGeometryService.getAngleParameterOnArc(angleA, arcA),
        parameterB: this.arcCenterGeometryService.getAngleParameterOnArc(angleB, arcB),
      }),
    ];
  }

  private deduplicateIntersections(intersections: PathPrimitiveIntersection[]): PathPrimitiveIntersection[] {
    return intersections.filter((intersection, index) =>
      intersections.every(
        (otherIntersection, otherIndex) =>
          otherIndex >= index ||
          Math.hypot(
            intersection.point.x - otherIntersection.point.x,
            intersection.point.y - otherIntersection.point.y,
          ) > this.epsilon,
      ),
    );
  }

  public getIntersections(primitiveA: PathPrimitive, primitiveB: PathPrimitive): PathPrimitiveIntersection[] {
    if (primitiveA instanceof Segment && primitiveB instanceof Segment) {
      return this.getSegmentSegmentIntersections(primitiveA, primitiveB);
    }

    if (primitiveA instanceof Segment && primitiveB instanceof CornerDefinitionArcCenter) {
      return this.getSegmentArcIntersections(primitiveA, primitiveB);
    }

    if (primitiveA instanceof CornerDefinitionArcCenter && primitiveB instanceof Segment) {
      return this.getSegmentArcIntersections(primitiveB, primitiveA, true);
    }

    if (primitiveA instanceof CornerDefinitionArcCenter && primitiveB instanceof CornerDefinitionArcCenter) {
      return this.getArcArcIntersections(primitiveA, primitiveB);
    }

    return [];
  }

  public getAllIntersections(primitives: PathPrimitive[]): PathPrimitiveIntersection[] {
    const pairs = this.pathPrimitivePairService.getIntersectingBoundingBoxPairs(primitives);

    return pairs.flatMap((pair) => this.getIntersections(pair.primitiveA, pair.primitiveB));
  }

  private isEndpointParameter(parameter: number): boolean {
    return parameter <= this.epsilon || parameter >= 1 - this.epsilon;
  }

  private isOnlySharedEndpoint(intersection: PathPrimitiveIntersection): boolean {
    return this.isEndpointParameter(intersection.parameterA) && this.isEndpointParameter(intersection.parameterB);
  }

  public getSplitIntersections(primitives: PathPrimitive[]): PathPrimitiveIntersection[] {
    return this.getAllIntersections(primitives).filter((intersection) => !this.isOnlySharedEndpoint(intersection));
  }
}
