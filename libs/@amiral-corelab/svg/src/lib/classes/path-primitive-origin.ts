import type { InitArg } from '@amiral-corelab/core';

/**
 * Describes where a drawable path primitive came from in a logical path.
 *
 * This metadata is intentionally separate from `PathPrimitive` so geometry classes stay
 * reusable and `PathPrimitive` remains only `Segment | CornerDefinitionArcCenter`.
 */
export class PathPrimitiveOrigin {
  /**
   * Stable path identifier supplied by the caller.
   */
  public readonly pathId: string;

  /**
   * Primitive index in drawing order inside the source path.
   */
  public readonly primitiveIndex: number;

  /**
   * Previous primitive index in the same source path, when one exists.
   */
  public readonly previousPrimitiveIndex: number | undefined;

  /**
   * Next primitive index in the same source path, when one exists.
   */
  public readonly nextPrimitiveIndex: number | undefined;

  /**
   * Creates primitive origin metadata.
   *
   * @param initArg Source origin values.
   */
  public constructor(initArg?: InitArg<PathPrimitiveOrigin>) {
    this.pathId = initArg?.pathId ?? '';
    this.primitiveIndex = initArg?.primitiveIndex ?? 0;
    this.previousPrimitiveIndex = initArg?.previousPrimitiveIndex ?? undefined;
    this.nextPrimitiveIndex = initArg?.nextPrimitiveIndex ?? undefined;
  }
}
