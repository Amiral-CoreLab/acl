import { ChangeDetectionStrategy, Component, input, model, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'acl-input-checkbox',
  imports: [FormsModule],
  templateUrl: './input-checkbox.component.html',
  styleUrl: './input-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class InputCheckboxComponent {
  /**
   * @description
   * Input name
   */
  public readonly name = input.required<string>();

  /**
   * @description
   * Checkbox indeterminate property
   */
  public readonly indeterminate = input<boolean>(false);

  /**
   * @description
   * Input model
   */
  public readonly model = model.required<boolean>();
}
