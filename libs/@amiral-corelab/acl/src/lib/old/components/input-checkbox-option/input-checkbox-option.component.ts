import { ChangeDetectionStrategy, Component, computed, input, model, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IndexConstant } from '../../constants';

@Component({
  selector: 'acl-input-checkbox-option',
  imports: [FormsModule],
  templateUrl: './input-checkbox-option.component.html',
  styleUrl: './input-checkbox-option.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class InputCheckboxOptionComponent {
  /**
   * @description
   * Input name
   */
  public readonly name = input.required<string>();

  /**
   * @description
   * Input value. Same behavior as a radio input value.
   */
  public readonly value = input.required<string>();

  /**
   * @description
   * Input model
   */
  public readonly model = model.required<string[]>();

  protected readonly checked = computed(() => this.model().includes(this.value()));

  protected readonly toggle = (): void => {
    const value = this.value();
    const index = this.model().indexOf(value);

    if (index === IndexConstant.notFound) {
      this.model.update((list) => [...list, value]);
    } else {
      this.model.update((list) => list.filter((v) => v !== value));
    }
  };
}
