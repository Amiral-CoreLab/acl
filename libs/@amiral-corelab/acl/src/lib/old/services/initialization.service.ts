import { inject, Injectable } from '@angular/core';
import { ColorThemeService } from './color-theme.service';

@Injectable({
  providedIn: 'root',
})
export class InitializationService {
  protected colorTheme = inject(ColorThemeService);
}
