import { getSingleton, Singleton } from '@amiral-corelab/core';
import type { PathPrimitive } from '../types';
import { CornerDefinitionArcCenter, PathPrimitiveOrigin, PathPrimitiveWithOrigin, Point, Segment } from '../classes';
import { PathPrimitiveIntersectionService, type PathPrimitiveIntersectionInput } from './path-primitive-intersection.service';

/**
 * Splits path primitives at normalized parameters, usually produced by intersections.
 */
@Singleton()
export class PathPrimitiveSplitService {
  private readonly epsilon = 1e-9;
  private readonly pathPrimitiveIntersectionService = getSingleton(PathPrimitiveIntersectionService);

  private isInteriorParameter(parameter: number): boolean {
    return parameter > this.epsilon && parameter < 1 - this.epsilon;
  }

  private deduplicateParameters(parameters: number[]): number[] {
    return parameters
      .filter((parameter) => this.isInteriorParameter(parameter))
      .sort((parameterA, parameterB) => parameterA - parameterB)
      .filter(
        (parameter, index, sortedParameters) =>
          index === 0 || Math.abs(parameter - (sortedParameters[index - 1] ?? parameter)) > this.epsilon,
      );
  }

  private getSegmentPointAtParameter(segment: Segment, parameter: number): Point {
    return new Point({
      x: segment.start.x + (segment.end.x - segment.start.x) * parameter,
      y: segment.start.y + (segment.end.y - segment.start.y) * parameter,
    });
  }

  private splitSegment(segment: Segment, parameters: number[]): Segment[] {
    const splitParameters = [0, ...this.deduplicateParameters(parameters), 1];
    const segments: Segment[] = [];

    for (let index = 0; index < splitParameters.length - 1; index += 1) {
      const startParameter = splitParameters[index];
      const endParameter = splitParameters[index + 1];

      if (startParameter === undefined || endParameter === undefined) {
        continue;
      }

      segments.push(
        new Segment({
          start: this.getSegmentPointAtParameter(segment, startParameter),
          end: this.getSegmentPointAtParameter(segment, endParameter),
        }),
      );
    }

    return segments;
  }

  private splitArc(arc: CornerDefinitionArcCenter, parameters: number[]): CornerDefinitionArcCenter[] {
    const splitParameters = [0, ...this.deduplicateParameters(parameters), 1];
    const arcs: CornerDefinitionArcCenter[] = [];

    for (let index = 0; index < splitParameters.length - 1; index += 1) {
      const startParameter = splitParameters[index];
      const endParameter = splitParameters[index + 1];

      if (startParameter === undefined || endParameter === undefined) {
        continue;
      }

      arcs.push(
        new CornerDefinitionArcCenter({
          center: arc.center,
          radiusX: arc.radiusX,
          radiusY: arc.radiusY,
          axisRotation: arc.axisRotation,
          startAngle: arc.startAngle + arc.deltaAngle * startParameter,
          deltaAngle: arc.deltaAngle * (endParameter - startParameter),
        }),
      );
    }

    return arcs;
  }

  private getPrimitiveInputItem(input: PathPrimitiveIntersectionInput): PathPrimitiveWithOrigin {
    if (input instanceof PathPrimitiveWithOrigin) {
      return input;
    }

    return new PathPrimitiveWithOrigin({ primitive: input });
  }

  private getOutputOrigins(items: PathPrimitiveWithOrigin[], splitPrimitives: PathPrimitive[][]): PathPrimitiveOrigin[][] {
    const pathCounts = new Map<string, number>();

    for (const item of items) {
      pathCounts.set(item.origin.pathId, 0);
    }

    const origins = items.map((item, itemIndex) =>
      splitPrimitives[itemIndex]?.map(() => {
        const pathId = item.origin.pathId;
        const primitiveIndex = pathCounts.get(pathId) ?? 0;
        pathCounts.set(pathId, primitiveIndex + 1);

        return new PathPrimitiveOrigin({ pathId, primitiveIndex });
      }) ?? [],
    );

    const byPath = new Map<string, PathPrimitiveOrigin[]>();

    for (const pathOrigins of origins) {
      for (const origin of pathOrigins) {
        byPath.set(origin.pathId, [...(byPath.get(origin.pathId) ?? []), origin]);
      }
    }

    return origins.map((pathOrigins) =>
      pathOrigins.map((origin) => {
        const siblings = byPath.get(origin.pathId) ?? [];
        const previousOrigin = siblings[origin.primitiveIndex - 1];
        const nextOrigin = siblings[origin.primitiveIndex + 1];

        return new PathPrimitiveOrigin({
          pathId: origin.pathId,
          primitiveIndex: origin.primitiveIndex,
          previousPrimitiveIndex: previousOrigin?.primitiveIndex,
          nextPrimitiveIndex: nextOrigin?.primitiveIndex,
        });
      }),
    );
  }

  /**
   * Splits one primitive at normalized parameters.
   *
   * @param primitive Primitive to split.
   * @param parameters Normalized split parameters. Endpoint parameters are ignored.
   *
   * @returns Split primitives in the original primitive direction.
   */
  public splitPrimitive(primitive: PathPrimitive, parameters: number[]): PathPrimitive[] {
    if (primitive instanceof Segment) {
      return this.splitSegment(primitive, parameters);
    }

    if (primitive instanceof CornerDefinitionArcCenter) {
      return this.splitArc(primitive, parameters);
    }

    return [];
  }

  /**
   * Splits primitives at all non-continuity intersections between them.
   *
   * @param inputs Primitives or primitive wrappers to split.
   *
   * @returns Split primitives wrapped with fresh origin metadata in split drawing order.
   */
  public splitPrimitives(inputs: PathPrimitiveIntersectionInput[]): PathPrimitiveWithOrigin[] {
    const items = inputs.map((input) => this.getPrimitiveInputItem(input));
    const parametersByPrimitive = new Map<PathPrimitive, number[]>();

    for (const intersection of this.pathPrimitiveIntersectionService.getSplitIntersections(inputs)) {
      parametersByPrimitive.set(intersection.primitiveA, [
        ...(parametersByPrimitive.get(intersection.primitiveA) ?? []),
        intersection.parameterA,
      ]);
      parametersByPrimitive.set(intersection.primitiveB, [
        ...(parametersByPrimitive.get(intersection.primitiveB) ?? []),
        intersection.parameterB,
      ]);
    }

    const splitPrimitives = items.map((item) =>
      this.splitPrimitive(item.primitive, parametersByPrimitive.get(item.primitive) ?? []),
    );
    const origins = this.getOutputOrigins(items, splitPrimitives);

    return splitPrimitives.flatMap((primitives, itemIndex) =>
      primitives.map((primitive, primitiveIndex) => {
        const origin = origins[itemIndex]?.[primitiveIndex];

        return origin
          ? new PathPrimitiveWithOrigin({ primitive, origin })
          : new PathPrimitiveWithOrigin({ primitive });
      }),
    );
  }
}
