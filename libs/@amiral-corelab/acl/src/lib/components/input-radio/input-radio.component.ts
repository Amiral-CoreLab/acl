import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'acl-input-radio',
  imports: [],
  templateUrl: './input-radio.component.html',
  styleUrl: './input-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class InputRadioComponent {}
