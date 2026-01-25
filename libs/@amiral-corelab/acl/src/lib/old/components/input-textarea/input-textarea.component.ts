import { ChangeDetectionStrategy, Component, computed, input, model, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getTextLineCountUtil } from '../../utils/get-text-line-count.util';

@Component({
  selector: 'acl-input-textarea',
  imports: [FormsModule],
  templateUrl: './input-textarea.component.html',
  styleUrl: './input-textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.auto-resize]': 'computedAutoResize()',
  },
})
export class InputTextareaComponent {
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

  /**
   * @description
   * Enables automatic vertical resizing based on the content
   */
  public readonly autoResize = input<boolean>(false);

  /**
   * @description
   * Minimum number of visible text rows
   */
  // Minimum 2 lines
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  public readonly minRows = input<number>(2);

  /**
   * @description
   * Maximum number of visible text rows
   */
  public readonly maxRows = input<number>();

  private readonly lineCount = computed<number>(() => getTextLineCountUtil(this.model()));

  protected readonly computedRows = computed<number>(() => {
    const lineCount = this.lineCount();
    const minRows = this.minRows();

    if (!this.autoResize()) {
      return minRows;
    }

    if (lineCount <= minRows) {
      return minRows;
    }

    return this.maxRows() ?? lineCount;
  });

  protected readonly computedAutoResize = computed<boolean>(() => {
    const lineCount = this.lineCount();
    const maxRows = this.maxRows();

    if (!this.autoResize()) {
      return false;
    }

    if (lineCount <= this.minRows()) {
      return false;
    }

    if (maxRows === undefined) {
      return true;
    }

    return lineCount < maxRows;
  });
}
