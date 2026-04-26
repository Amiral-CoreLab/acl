import type { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Path, splitPathsIntoShapes, Vertex } from '@amiral-corelab/svg';

@Component({
  selector: 'acl-shell-root',
  imports: [],
  templateUrl: './app.component.svg',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  public ngAfterViewInit(): void {
    const path = new Path([
      new Vertex(100, 100, 0),
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
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', path.d);
    pathEl.style.fill = 'none';
    pathEl.style.stroke = 'black';
    pathEl.style.strokeWidth = '2';

    const path2 = new Path([
      new Vertex(100, 50, 0),
      new Vertex(150, 50, 25),
      new Vertex(150, 300, 0),
      new Vertex(100, 300, 0),
    ]);
    path2.isPathClosed = true;
    const path2El = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2El.setAttribute('d', path2.d);
    path2El.style.fill = 'none';
    path2El.style.stroke = 'black';
    path2El.style.strokeWidth = '2';

    document.querySelector('svg')?.append(pathEl, path2El);

    console.log(
      splitPathsIntoShapes([path, path2]).map((x) => {
        const xEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        xEl.setAttribute('d', x.d);
        xEl.style.fill = 'none';
        xEl.style.stroke = 'black';
        xEl.style.strokeWidth = '2';

        document.querySelector('svg')?.append(xEl);

        return x;
      }),
    );
  }
}
