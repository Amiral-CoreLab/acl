import type { InitArg } from '@amiral-corelab/core';
import { getNeighborIndexes, isFirstIndex, isLastIndex } from '@amiral-corelab/core';
import type { Vertex } from './vertex';
import type { PathCommand } from './path-command';
import type { PathPrimitive } from './types/path-primitive';
import { CornerDefinitionArcCenter } from './corner-definition-arc-center';
import { CornerVertices } from './corner-vertices';

export class Path {
  public readonly vertices: Vertex[] = [];
  public readonly closed: boolean;

  public constructor(initArg?: InitArg<Path>) {
    this.vertices = initArg?.vertices ?? [];
    this.closed = initArg?.closed ?? false;
  }

  private getNeighborVertices(index: number): {
    previousVertex: Vertex | undefined;
    currentVertex: Vertex | undefined;
    nextVertex: Vertex | undefined;
  } {
    const { vertices } = this;
    const { previousIndex, currentIndex, nextIndex } = getNeighborIndexes(index, vertices.length);

    if (!this.closed) {
      if (isFirstIndex(index)) {
        return {
          previousVertex: undefined,
          currentVertex: vertices[currentIndex],
          nextVertex: vertices[nextIndex],
        };
      }

      if (isLastIndex(index, vertices.length)) {
        return {
          previousVertex: vertices[previousIndex],
          currentVertex: vertices[currentIndex],
          nextVertex: undefined,
        };
      }
    }

    return {
      previousVertex: vertices[previousIndex],
      currentVertex: vertices[currentIndex],
      nextVertex: vertices[nextIndex],
    };
  }

  private getCornerVertices(index: number): CornerVertices | undefined {
    const { previousVertex, currentVertex, nextVertex } = this.getNeighborVertices(index);

    if (!previousVertex || !currentVertex || !nextVertex) {
      return undefined;
    }

    return new CornerVertices({ previous: previousVertex, current: currentVertex, next: nextVertex });
  }

  private resolveCorner(index: number): CornerDefinitionArcCenter | undefined {
    const cornerVertices = this.getCornerVertices(index);

    if (!cornerVertices) {
      return cornerVertices;
    }

    // Des trois vertices je dois calculer le current en fonction des autre
    // Se faire des règle de puissance sur qui gagne sur qui
    // Faire en sorte de comprendre les limite des type d'arc pour définir des supériorité et/ou autre

    const context = this.getCornerContext(index);

    if (!context) {
      return undefined;
    }

    const { previous, current, next } = context;
    const { cornerDefinition } = current;

    if (cornerDefinition === undefined) {
      return undefined;
    }

    if (cornerDefinition instanceof CornerDefinitionRadius) {
      return this.resolveRadiusCorner(previous, current, next, cornerDefinition);
    }

    if (cornerDefinition instanceof CornerDefinitionArcCenter) {
      return cornerDefinition;
    }

    return undefined;
  }

  public toPrimitives(): PathPrimitive[] {
    // 1. resolve corners
    // 2. create segments + arcs

    return [];
  }

  public toCommands(): PathCommand[] {
    // Primitive

    return [];
  }
}
