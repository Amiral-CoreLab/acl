import { getSingleton, Singleton } from '@amiral-corelab/core';
import { CornerDefinitionArcCenter, PathPrimitiveIntersection, Point } from '../classes';
import { ArcCenterGeometryService } from './arc-center-geometry.service';
import { AngleService } from './angle.service';

/**
 * Computes intersections between center-parameterized arcs.
 */
@Singleton()
export class ArcArcIntersectionService {
  private readonly epsilon = 1e-9;
  private readonly tangencyValueEpsilon = 1e-7;
  private readonly arcIntersectionSampleAngle = Math.PI / 128;
  private readonly arcCenterGeometryService = getSingleton(ArcCenterGeometryService);
  private readonly angleService = getSingleton(AngleService);

  private isZero(value: number): boolean {
    return Math.abs(value) <= this.epsilon;
  }

  private isNearlySamePoint(pointA: Point, pointB: Point): boolean {
    return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) <= this.epsilon;
  }

  private getSmallestAngleDifference(angleA: number, angleB: number): number {
    const fullTurn = Math.PI * 2;
    const difference = this.angleService.normalizeRadians(angleA - angleB);

    return Math.min(difference, fullTurn - difference);
  }

  private areSameEllipse(arcA: CornerDefinitionArcCenter, arcB: CornerDefinitionArcCenter): boolean {
    return (
      this.isNearlySamePoint(arcA.center, arcB.center) &&
      Math.abs(arcA.radiusX - arcB.radiusX) <= this.epsilon &&
      Math.abs(arcA.radiusY - arcB.radiusY) <= this.epsilon &&
      this.getSmallestAngleDifference(arcA.axisRotation, arcB.axisRotation) <= this.epsilon
    );
  }

  private deduplicateIntersections(intersections: PathPrimitiveIntersection[]): PathPrimitiveIntersection[] {
    return intersections.filter((intersection, index) =>
      intersections.every(
        (otherIntersection, otherIndex) =>
          otherIndex >= index || !this.isNearlySamePoint(intersection.point, otherIntersection.point),
      ),
    );
  }

  private getSameEllipseArcIntersections(
    arcA: CornerDefinitionArcCenter,
    arcB: CornerDefinitionArcCenter,
  ): PathPrimitiveIntersection[] {
    const candidateAngles = [
      arcA.startAngle,
      arcA.startAngle + arcA.deltaAngle,
      arcB.startAngle,
      arcB.startAngle + arcB.deltaAngle,
    ];

    return this.deduplicateIntersections(
      candidateAngles.flatMap((angleA) => {
        const point = arcA.getPointAtAngle(angleA);
        const angleB = this.arcCenterGeometryService.getPointAngleOnArc(point, arcB);

        if (
          !this.arcCenterGeometryService.isAngleOnArc(angleA, arcA.startAngle, arcA.deltaAngle) ||
          !this.arcCenterGeometryService.isAngleOnArc(angleB, arcB.startAngle, arcB.deltaAngle)
        ) {
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
      }),
    );
  }

  private getEllipseValue(arcA: CornerDefinitionArcCenter, arcB: CornerDefinitionArcCenter, angleA: number): number {
    return this.arcCenterGeometryService.getPointEllipseValue(arcA.getPointAtAngle(angleA), arcB);
  }

  private findCrossingAngle(
    arcA: CornerDefinitionArcCenter,
    arcB: CornerDefinitionArcCenter,
    angleStart: number,
    angleEnd: number,
  ): number {
    let start = angleStart;
    let end = angleEnd;
    let startValue = this.getEllipseValue(arcA, arcB, start);

    for (let iteration = 0; iteration < 64; iteration += 1) {
      const middle = (start + end) / 2;
      const middleValue = this.getEllipseValue(arcA, arcB, middle);

      if (this.isZero(middleValue)) {
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

  private findMinimumAbsValueAngle(
    arcA: CornerDefinitionArcCenter,
    arcB: CornerDefinitionArcCenter,
    angleStart: number,
    angleEnd: number,
  ): number {
    let start = angleStart;
    let end = angleEnd;

    for (let iteration = 0; iteration < 48; iteration += 1) {
      const first = start + (end - start) / 3;
      const second = end - (end - start) / 3;
      const firstValue = Math.abs(this.getEllipseValue(arcA, arcB, first));
      const secondValue = Math.abs(this.getEllipseValue(arcA, arcB, second));

      if (firstValue < secondValue) {
        end = second;
      } else {
        start = first;
      }
    }

    return (start + end) / 2;
  }

  private createIntersections(
    arcA: CornerDefinitionArcCenter,
    arcB: CornerDefinitionArcCenter,
    angleA: number,
  ): PathPrimitiveIntersection[] {
    const point = arcA.getPointAtAngle(angleA);
    const angleB = this.arcCenterGeometryService.getPointAngleOnArc(point, arcB);

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

  /**
   * Computes intersections between two center arcs.
   *
   * Crossing intersections are found by bracketing sign changes of the second ellipse's
   * implicit equation along the first arc. Tangencies are improved by also searching local
   * minima of the absolute implicit value. Same-ellipse overlaps return the overlap boundary
   * points, which gives split points without manufacturing a single arbitrary overlap point.
   *
   * @param arcA First arc.
   * @param arcB Second arc.
   *
   * @returns Intersections between both arcs.
   */
  public getIntersections(arcA: CornerDefinitionArcCenter, arcB: CornerDefinitionArcCenter): PathPrimitiveIntersection[] {
    if (
      this.isZero(arcA.radiusX) ||
      this.isZero(arcA.radiusY) ||
      this.isZero(arcB.radiusX) ||
      this.isZero(arcB.radiusY)
    ) {
      return [];
    }

    if (this.areSameEllipse(arcA, arcB)) {
      return this.getSameEllipseArcIntersections(arcA, arcB);
    }

    const sampleCount = Math.max(32, Math.ceil(Math.abs(arcA.deltaAngle) / this.arcIntersectionSampleAngle));
    const intersections: PathPrimitiveIntersection[] = [];

    for (let index = 0; index < sampleCount; index += 1) {
      const parameterStart = index / sampleCount;
      const parameterEnd = (index + 1) / sampleCount;
      const angleStart = arcA.startAngle + arcA.deltaAngle * parameterStart;
      const angleEnd = arcA.startAngle + arcA.deltaAngle * parameterEnd;
      const valueStart = this.getEllipseValue(arcA, arcB, angleStart);
      const valueEnd = this.getEllipseValue(arcA, arcB, angleEnd);

      if (this.isZero(valueStart)) {
        intersections.push(...this.createIntersections(arcA, arcB, angleStart));
      }

      if (valueStart * valueEnd <= 0) {
        intersections.push(...this.createIntersections(arcA, arcB, this.findCrossingAngle(arcA, arcB, angleStart, angleEnd)));
        continue;
      }

      const minimumAngle = this.findMinimumAbsValueAngle(arcA, arcB, angleStart, angleEnd);

      if (Math.abs(this.getEllipseValue(arcA, arcB, minimumAngle)) <= this.tangencyValueEpsilon) {
        intersections.push(...this.createIntersections(arcA, arcB, minimumAngle));
      }
    }

    const endAngle = arcA.startAngle + arcA.deltaAngle;

    if (this.isZero(this.getEllipseValue(arcA, arcB, endAngle))) {
      intersections.push(...this.createIntersections(arcA, arcB, endAngle));
    }

    return this.deduplicateIntersections(intersections);
  }
}
