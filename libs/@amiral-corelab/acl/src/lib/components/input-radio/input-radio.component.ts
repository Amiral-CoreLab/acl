import { ChangeDetectionStrategy, Component, input, model, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'acl-input-radio',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './input-radio.component.html',
  styleUrl: './input-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class InputRadioComponent {
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
   * Input value
   */
  public readonly value = input.required<string>();

  /**
   * @remarks
   * **@required**
   *
   * @description
   * Input model
   */
  public readonly model = model.required<string>();
}
