import { InjectionToken } from '@angular/core';

export interface AclColorToken {
  defaultBackgroundColor: string;
  defaultHue: number;
  semanticHue: {
    danger: number;
    error: number;
    warning: number;
    success: number;
    information: number;
  };
  chroma: {
    primary: number;
    secondary: number;
    danger: number;
  };
  contrast: {
    default: number;
    hover: number;
    active: number;
    semantic: number;
  };
  background: {
    maxValue: number;
  };
}

export const ACL_COLOR_TOKEN = new InjectionToken<AclColorToken>('ACL_COLOR_TOKEN', {
  factory: (): AclColorToken => ({
    defaultBackgroundColor: '#F2F0EB',
    defaultHue: 200,
    semanticHue: { danger: 29, error: 29, warning: 90, success: 145, information: 235 },
    chroma: { primary: 1, secondary: 0, danger: 1 },
    contrast: { default: 65, hover: 75, active: 80, semantic: 50 },
    background: { maxValue: 0.95 },
  }),
});
