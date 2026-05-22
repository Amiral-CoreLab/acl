import type { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CornerDefinitionRadius, Path, Vertex } from '@amiral-corelab/svg';

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
        new Vertex({ x: 200, y: 100, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 300, y: 100, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 300, y: 150, cornerDefinition: new CornerDefinitionRadius({ radius: 0 }) }),
        new Vertex({ x: 250, y: 150, cornerDefinition: new CornerDefinitionRadius({ radius: 25 }) }),
        new Vertex({ x: 250, y: 50, cornerDefinition: new CornerDefinitionRadius({ radius: 25 }) }),
        new Vertex({ x: 200, y: 200, cornerDefinition: new CornerDefinitionRadius({ radius: 250 }) }),
        new Vertex({ x: 100, y: 200, cornerDefinition: new CornerDefinitionRadius({ radius: 3000 }) }),
        new Vertex({ x: 50, y: 150, cornerDefinition: new CornerDefinitionRadius({ radius: 300 }) }),
      ],
    });

    console.log(path.toPrimitives());
    console.log(path.toCommands());

    const svg = document.getElementById('svg') as unknown as SVGSVGElement;
    const pathEL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEL.setAttribute(
      'd',
      path
        .toCommands()
        .map((command) => command.getD())
        .join(' '),
    );
    svg.appendChild(pathEL);
  }
}
