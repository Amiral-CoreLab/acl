import { ChangeDetectionStrategy, Component, input, model, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberDirective } from '../../directives';

@Component({
  selector: 'acl-input-number',
  imports: [FormsModule, InputNumberDirective],
  templateUrl: './input-number.component.html',
  styleUrl: './input-number.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class InputNumberComponent {
  private readonly constant = { initialValue: 0, defaultStep: 1 } as const;

  /**
   * @remarks
   * **@required**
   *
   * @description
   * Input name
   */
  public readonly name = input.required<string>();

  /**
   * @remarks
   * **@required**
   *
   * @description
   * Input model
   */
  public readonly model = model.required<number | null>();

  public readonly integerOnly = input<boolean>(false);

  public readonly step = input<number>(this.constant.defaultStep);

  public readonly min = input<number>();

  public readonly max = input<number>();

  protected readonly keydownEvent = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'ArrowUp':
        this.model.update((value) => {
          const max = this.max();

          if (max !== undefined) {
            return Math.min(max, (value ?? this.constant.initialValue) + this.step());
          }

          return (value ?? this.constant.initialValue) + this.step();
        });
        break;
      case 'ArrowDown':
        this.model.update((value) => {
          const min = this.min();

          if (min !== undefined) {
            return Math.max(min, (value ?? this.constant.initialValue) - this.step());
          }

          return (value ?? this.constant.initialValue) - this.step();
        });
        break;
      default:
        break;
    }
  };
}
