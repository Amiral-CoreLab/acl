import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import type { IconType } from './icon.type';

@Component({
  selector: 'acl-icon',
  imports: [],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[style.mask-image]': `iconVar()`,
  },
})
export class IconComponent {
  public readonly name = input.required<IconType>();

  /** @ignore */
  protected readonly iconVar = computed((): string => `var(--acl-icon-${this.name()})`);
}
