/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Path } from '../classes/path';
import { Vertex } from '../classes/vertex';
import { splitPathsIntoShapes } from './split-paths-into-shapes.util';

function createSplitRegressionPaths(): Path[] {
  const path = new Path([
    new Vertex(100, 100, 100),
    new Vertex(200, 100, 25),
    new Vertex(300, 100, 0),
    new Vertex(300, 150, 0),
    new Vertex(250, 150, 25),
    new Vertex(250, 50, 25),
    new Vertex(200, 200, 250),
    new Vertex(100, 200, 3000),
    new Vertex(50, 150, 300),
  ]);
  path.isPathClosed = true;

  const path2 = new Path([
    new Vertex(100, 50, 0),
    new Vertex(150, 50, 25),
    new Vertex(150, 300, 0),
    new Vertex(100, 300, 0),
  ]);
  path2.isPathClosed = true;

  return [path, path2];
}

describe('splitPathsIntoShapes', () => {
  it('moves a closing arc entry point onto the logical first vertex', () => {
    const shapes = splitPathsIntoShapes(createSplitRegressionPaths());
    const topLeftShape = shapes.find((shape) =>
      [
        [100, 50],
        [150, 50],
        [150, 100],
        [100, 101.8602388843193],
      ].every(([x, y]) => shape.vertices.some((vertex) => vertex.x === x && vertex.y === y)),
    );

    expect(topLeftShape?.vertices).toHaveLength(4);
    expect(topLeftShape?.vertices[3]?.customCornerArc?.entry.x).toBe(108.57864376269049);
    expect(topLeftShape?.vertices[3]?.customCornerArc?.entry.y).toBe(100);
    expect(topLeftShape?.vertices[3]?.customCornerArc?.exit.x).toBe(100);
    expect(topLeftShape?.vertices[3]?.customCornerArc?.exit.y).toBe(101.8602388843193);
  });

  it('keeps the bottom split shape closing arc as a fourth logical vertex', () => {
    const shapes = splitPathsIntoShapes(createSplitRegressionPaths());
    const bottomShape = shapes.find((shape) =>
      [
        [150, 199.82377936025472],
        [150, 300],
        [100, 300],
        [100, 187.64860887996525],
      ].every(([x, y]) => shape.vertices.some((vertex) => vertex.x === x && vertex.y === y)),
    );

    expect(bottomShape?.vertices).toHaveLength(4);
    expect(bottomShape?.vertices[3]?.customCornerArc?.entry.x).toBe(100);
    expect(bottomShape?.vertices[3]?.customCornerArc?.entry.y).toBe(187.64860887996525);
    expect(bottomShape?.vertices[3]?.customCornerArc?.exit.x).toBe(150);
    expect(bottomShape?.vertices[3]?.customCornerArc?.exit.y).toBe(199.82377936025472);
  });

  it('keeps the left split triangle on its logical split points', () => {
    const shapes = splitPathsIntoShapes(createSplitRegressionPaths());
    const triangle = shapes.find((shape) =>
      [
        [100, 187.64860887996525],
        [100, 101.8602388843193],
        [50, 150],
      ].every(([x, y]) => shape.vertices.some((vertex) => vertex.x === x && vertex.y === y)),
    );

    expect(triangle?.vertices).toHaveLength(3);
    expect(triangle?.vertices[0]?.customCornerArc?.entry.x).toBe(59.723586396525604);
    expect(triangle?.vertices[0]?.customCornerArc?.entry.y).toBe(159.7235863965256);
    expect(triangle?.vertices[0]?.cornerRadius).toBe(0);
    expect(triangle?.vertices[1]?.customCornerArc).toBeDefined();
    expect(triangle?.vertices[2]?.customCornerArc?.entry.x).toBe(59.723586396525604);
    expect(triangle?.vertices[2]?.customCornerArc?.entry.y).toBe(140.2764136034744);
    expect(triangle?.vertices[2]?.cornerRadius).toBe(0);
    expect(triangle?.d).toContain('A137.5122775687305 137.5122775687305 0 0 0 100 187.64860887996525');
    expect(triangle?.d).toContain('L100 101.8602388843193');
    expect(triangle?.d).toContain('A13.751227756873043 13.751227756873043 0 0 0 59.723586396525604 159.7235863965256');
  });
});
