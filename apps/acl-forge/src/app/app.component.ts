import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { Canvas } from './shared/classes/canvas';

@Component({
  selector: 'acl-forge-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  public constructor() {
    this.elementRef.nativeElement.append(new Canvas().dom);
  }
}
