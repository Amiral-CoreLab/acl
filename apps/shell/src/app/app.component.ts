import type { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CornerDefinitionRadius, Path, PathPrimitiveIntersectionService, Vertex } from '@amiral-corelab/svg';
import { getSingleton } from '@amiral-corelab/core';

@Component({
  selector: 'acl-shell-root',
  imports: [],
  templateUrl: './app.component.svg',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  public ngAfterViewInit(): void {
    const path = new Path({
      closed: true,
      vertices: [
        new Vertex({ x: 100, y: 100, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 300, y: 100, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 300, y: 150, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 250, y: 150, cornerDefinition: new CornerDefinitionRadius({ radius: 25 }) }),
        new Vertex({ x: 250, y: 50, cornerDefinition: new CornerDefinitionRadius({ radius: 25 }) }),
        new Vertex({ x: 200, y: 200, cornerDefinition: new CornerDefinitionRadius({ radius: 250 }) }),
        new Vertex({ x: 100, y: 200, cornerDefinition: new CornerDefinitionRadius({ radius: 3000 }) }),
        new Vertex({ x: 50, y: 150, cornerDefinition: new CornerDefinitionRadius({ radius: 300 }) }),
      ],
    });

    const path2 = new Path({
      closed: true,
      vertices: [
        new Vertex({ x: 100, y: 50, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 150, y: 50, cornerDefinition: new CornerDefinitionRadius({ radius: 25 }) }),
        new Vertex({ x: 150, y: 300, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 100, y: 300, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
      ],
    });

    const path3 = new Path({
      closed: true,
      vertices: [
        new Vertex({ x: 0, y: 50, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 300, y: 200, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 200, y: 300, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
      ],
    });

    const path4 = new Path({
      closed: true,
      vertices: [
        new Vertex({ x: 50, y: 150, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 400, y: 125, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 75, y: 275, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 150, y: 50, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 400, y: 400, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 200, y: 0, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 150, y: 350, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
      ],
    });

    const svg = document.getElementById('svg') as unknown as SVGSVGElement;
    const pathEL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEL.style.fill = 'none';
    pathEL.style.stroke = 'black';
    pathEL.style.strokeWidth = '2';
    svg.appendChild(pathEL);

    const pathPrimitiveIntersectionService = getSingleton(PathPrimitiveIntersectionService);

    console.log(
      pathPrimitiveIntersectionService.getSplitIntersections([
        ...path.toPrimitivesWithOrigin('path'),
        ...path2.toPrimitivesWithOrigin('path2'),
        ...path3.toPrimitivesWithOrigin('path3'),
        ...path4.toPrimitivesWithOrigin('path4'),
      ]),
    );

    pathEL.setAttribute('d', path.toD() + path2.toD() + path3.toD() + path4.toD());
  }
}
