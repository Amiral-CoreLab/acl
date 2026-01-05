import { ChangeDetectionStrategy, Component, input, model, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'acl-input-text',
  imports: [FormsModule],
  templateUrl: './input-text.component.html',
  styleUrl: './input-text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class InputTextComponent {
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
  public readonly model = model.required<string>();
}
