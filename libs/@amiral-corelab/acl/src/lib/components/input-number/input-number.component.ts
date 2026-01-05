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

  public readonly integerOnly = input(false);
}
