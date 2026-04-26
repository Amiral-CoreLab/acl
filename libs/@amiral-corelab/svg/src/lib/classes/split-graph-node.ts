import { Point } from './point';

/**
 * FR: Représente un nœud du graphe de split identifié par une clé et un point.
 * EN: Represents a split graph node identified by a key and a point.
 */
export class SplitGraphNode {
  public readonly key: string;
  public readonly point: Point;

  public constructor(key: string, point: Point) {
    this.key = key;
    this.point = point;
  }
}
