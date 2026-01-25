import type { AfterViewInit, OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, ElementRef, inject, model, signal } from '@angular/core';
import { WindowApiService } from '../../../infrastructure/window';
import { AnimationFrameService, clamp } from '@amiral-corelab/acl';

const DEFAULT_ZOOM = 100;
const MIN_ZOOM = 10;
const MAX_ZOOM = 1000;
const DEFAULT_COORDINATE = 0;
const TWO = 2;

@Component({
  selector: 'acl-feature-symbol-viewport',
  imports: [],
  templateUrl: './viewport.component.html',
  styleUrl: './viewport.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(wheel)': 'onWheelListener($event)',
  },
})
export class ViewportComponent implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly windowApiService = inject(WindowApiService);
  protected readonly animationFrameService = inject(AnimationFrameService);

  public readonly zoom = model(DEFAULT_ZOOM);
  public readonly zoomMin = model(MIN_ZOOM);
  public readonly zoomMax = model(MAX_ZOOM);
  public readonly x = model(DEFAULT_COORDINATE);
  public readonly y = model(DEFAULT_COORDINATE);

  private isControlPressed = false;
  private isMetaPressed = false;
  private isFocused = document.hasFocus();
  private wheelEventWaitingFrame: WheelEvent | undefined;
  private readonly childElement = signal<HTMLElement | SVGElement | undefined>(undefined);

  private readonly updateViewBox = (): void => {
    const childElement = this.childElement();

    if (!childElement) {
      return;
    }

    childElement.style.transformOrigin = '0 0';
    childElement.style.transform = `translate(${this.x()}px, ${this.y()}px) scale(${this.zoom() / DEFAULT_ZOOM})`;
  };

  private readonly centerChild = (): void => {
    const childElement = this.childElement();

    if (!childElement) {
      return;
    }

    const { width: parentWidth, height: parentHeight } = this.elementRef.nativeElement.getBoundingClientRect();
    const { width, height } = childElement.getBoundingClientRect();

    this.x.set(Math.round((parentWidth - width) / TWO));
    this.y.set(Math.round((parentHeight - height) / TWO));
    this.updateViewBox();
  };

  private readonly destroyFrameListener = this.animationFrameService.addFrameListener(() => {
    const event = this.wheelEventWaitingFrame;

    if (!event) {
      return;
    }

    this.wheelEventWaitingFrame = undefined;

    if (this.isControlPressed || this.isMetaPressed) {
      const { x: marginX, y: marginY } = this.elementRef.nativeElement.getBoundingClientRect();
      const pointerScreenX = event.clientX - marginX;
      const pointerScreenY = event.clientY - marginY;
      const previousScale = this.zoom() / DEFAULT_ZOOM;
      const worldX = (pointerScreenX - this.x()) / previousScale;
      const worldY = (pointerScreenY - this.y()) / previousScale;
      this.zoom.set(clamp(this.zoom() - event.deltaY, MIN_ZOOM, MAX_ZOOM));
      const nextScale = this.zoom() / DEFAULT_ZOOM;
      this.x.set(pointerScreenX - worldX * nextScale);
      this.y.set(pointerScreenY - worldY * nextScale);
    } else {
      this.x.update((x) => x + event.deltaX);
      this.y.update((y) => y + event.deltaY);
    }

    this.updateViewBox();
  });

  protected readonly onWheelListener = (event: WheelEvent): void => {
    if (!this.isFocused) {
      return;
    }

    this.wheelEventWaitingFrame = event;
  };

  protected readonly destroyWindowKeydownListener = this.windowApiService.addWindowListener('keydown', (event) => {
    if (event.key === 'Control') {
      this.isControlPressed = true;
    }

    if (event.key === 'Meta') {
      this.isMetaPressed = true;
    }
  });

  protected readonly destroyWindowKeyupListener = this.windowApiService.addWindowListener('keyup', (event) => {
    if (event.key === 'Control') {
      this.isControlPressed = false;
    }

    if (event.key === 'Meta') {
      this.isMetaPressed = false;
    }
  });

  protected readonly destroyWindowFocusListener = this.windowApiService.addWindowListener('focus', () => {
    this.isFocused = true;
  });

  protected readonly destroyWindowBlurListener = this.windowApiService.addWindowListener('blur', () => {
    this.isFocused = false;
  });

  public ngAfterViewInit(): void {
    const { firstElementChild } = this.elementRef.nativeElement;

    if (!(firstElementChild instanceof HTMLElement || firstElementChild instanceof SVGElement)) {
      return;
    }

    this.childElement.set(firstElementChild);
    this.centerChild();
  }

  public ngOnDestroy(): void {
    this.destroyWindowKeydownListener();
    this.destroyWindowKeyupListener();
    this.destroyWindowFocusListener();
    this.destroyWindowBlurListener();
    this.destroyFrameListener();
  }
}
