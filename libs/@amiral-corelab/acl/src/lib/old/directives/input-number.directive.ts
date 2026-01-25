import { Directive, ElementRef, inject, input } from '@angular/core';
import { IndexConstant } from '../constants';

@Directive({
  selector: 'input[type=text][aclInputNumber]',
  host: {
    '(beforeinput)': 'beforeinput($event)',
    '[attr.inputmode]': 'integerOnly() ? "numeric" : "decimal"',
  },
})
export class InputNumberDirective {
  public readonly integerOnly = input(false);

  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly integerRegex = /^[+-]?\d*(?:[eE][+]?\d*)?$/u;
  private readonly decimalRegex = /^[+-]?\d*\.?\d*(?:[eE][+-]?\d*)?$/u;

  private get regex(): RegExp {
    return this.integerOnly() ? this.integerRegex : this.decimalRegex;
  }

  private readonly getNextValue = (event: InputEvent): string => {
    const el = this.elementRef.nativeElement;
    const start = el.value.slice(IndexConstant.startOfValue, el.selectionStart ?? el.value.length);
    const end = el.value.slice(el.selectionEnd ?? el.value.length);
    const newChars = event.data ?? '';

    return `${start}${newChars}${end}`;
  };

  protected beforeinput = (event: InputEvent): void => {
    if (event.inputType.startsWith('delete')) {
      return;
    }

    if (this.regex.test(this.getNextValue(event))) {
      return;
    }

    event.preventDefault();
  };
}
