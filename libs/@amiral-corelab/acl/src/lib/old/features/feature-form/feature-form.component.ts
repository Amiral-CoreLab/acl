import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'acl-feature-form',
  imports: [],
  templateUrl: './feature-form.component.html',
  styleUrl: './feature-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class FeatureFormComponent {}
