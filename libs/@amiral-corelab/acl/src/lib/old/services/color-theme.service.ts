import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { assert } from '../core';
import type { Hsv } from 'culori';
import { converter, formatHex, parse } from 'culori';
import { ACL_COLOR_TOKEN } from '../tokens';
import { getApcachUtils } from '../utils';
import { apcachToCss } from 'apcach';

export interface ColorTheme {
  background: {
    default: string;
    popover: string;
    input: string;
  };
  primary: {
    default: string;
    hover: string;
    active: string;
  };
  secondary: {
    default: string;
    hover: string;
    active: string;
  };
  tertiary: {
    default: string;
    hover: string;
    active: string;
  };
  danger: {
    default: string;
    hover: string;
    active: string;
  };
  text: {
    default: string;
    reverse: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ColorThemeService {
  private readonly aclColorToken = inject(ACL_COLOR_TOKEN);
  private readonly hsvConverter = converter('hsv');

  private readonly background950 = computed<Hsv>(() => {
    const color = parse(this.aclColorToken.defaultBackgroundColor);

    assert(color !== undefined, 'Invalid color format');

    const hsv = this.hsvConverter(color);

    if (hsv.h !== undefined) {
      hsv.h = Math.round(hsv.h);
    }

    hsv.v = Math.min(hsv.v, this.aclColorToken.background.maxValue);

    if (hsv.alpha !== undefined) {
      delete hsv.alpha;
    }

    return hsv;
  });

  private readonly background950Hex = computed<string>(() => formatHex(this.background950()));

  private readonly background975 = computed<Hsv>(() => {
    const hsv = structuredClone(this.background950());
    hsv.v += 0.05;

    return hsv;
  });

  private readonly backgroundInput = computed<Hsv>(() => {
    const hsv = structuredClone(this.background950());
    hsv.v = 100;
    hsv.s = 0;

    return hsv;
  });

  private readonly textDefault = computed<Hsv>(() => {
    const hsv = structuredClone(this.backgroundInput());
    hsv.v = 0;

    return hsv;
  });

  private readonly backgroundInputHex = computed<string>(() => formatHex(this.backgroundInput()));

  private readonly getHex = (contrast: number, chroma: number): string =>
    apcachToCss(getApcachUtils(this.background950Hex(), contrast, chroma, this.hue()), 'hex');

  private readonly getSemanticHex = (contrast: number, chroma: number, hue: number): string =>
    apcachToCss(getApcachUtils(this.backgroundInputHex(), contrast, chroma, hue), 'hex');

  /**
   *
   */
  public readonly hue = signal<number>(this.aclColorToken.defaultHue);

  /**
   *
   */
  public readonly color = computed<ColorTheme>(() => {
    this.hue();

    return {
      background: {
        default: this.background950Hex(),
        popover: formatHex(this.background975()),
        input: formatHex(this.backgroundInput()),
      },
      primary: {
        default: this.getHex(this.aclColorToken.contrast.default, this.aclColorToken.chroma.primary),
        hover: this.getHex(this.aclColorToken.contrast.hover, this.aclColorToken.chroma.primary),
        active: this.getHex(this.aclColorToken.contrast.active, this.aclColorToken.chroma.primary),
      },
      secondary: {
        default: this.getHex(this.aclColorToken.contrast.default, this.aclColorToken.chroma.secondary),
        hover: this.getHex(this.aclColorToken.contrast.hover, this.aclColorToken.chroma.secondary),
        active: this.getHex(this.aclColorToken.contrast.active, this.aclColorToken.chroma.secondary),
      },
      tertiary: {
        default: 'rgba(0, 0, 0, 0.00)',
        hover: 'rgba(0, 0, 0, 0.10)',
        active: 'rgba(0, 0, 0, 0.20)',
      },
      danger: {
        default: this.getSemanticHex(
          this.aclColorToken.contrast.default,
          this.aclColorToken.chroma.danger,
          this.aclColorToken.semanticHue.danger,
        ),
        hover: this.getSemanticHex(
          this.aclColorToken.contrast.hover,
          this.aclColorToken.chroma.danger,
          this.aclColorToken.semanticHue.danger,
        ),
        active: this.getSemanticHex(
          this.aclColorToken.contrast.active,
          this.aclColorToken.chroma.danger,
          this.aclColorToken.semanticHue.danger,
        ),
      },
      text: {
        default: formatHex(this.textDefault()),
        reverse: this.backgroundInputHex(),
      },
    };
  });

  protected colorEffect = effect(() => {
    const { background, primary, secondary, tertiary, danger, text } = this.color();

    document.documentElement.style.setProperty('--acl-color-background-default', background.default);
    document.documentElement.style.setProperty('--acl-color-background-popover', background.popover);
    document.documentElement.style.setProperty('--acl-color-background-input', background.input);

    document.documentElement.style.setProperty('--acl-color-primary-default', primary.default);
    document.documentElement.style.setProperty('--acl-color-primary-hover', primary.hover);
    document.documentElement.style.setProperty('--acl-color-primary-active', primary.active);

    document.documentElement.style.setProperty('--acl-color-secondary-default', secondary.default);
    document.documentElement.style.setProperty('--acl-color-secondary-hover', secondary.hover);
    document.documentElement.style.setProperty('--acl-color-secondary-active', secondary.active);

    document.documentElement.style.setProperty('--acl-color-tertiary-default', tertiary.default);
    document.documentElement.style.setProperty('--acl-color-tertiary-hover', tertiary.hover);
    document.documentElement.style.setProperty('--acl-color-tertiary-active', tertiary.active);

    document.documentElement.style.setProperty('--acl-color-danger-default', danger.default);
    document.documentElement.style.setProperty('--acl-color-danger-hover', danger.hover);
    document.documentElement.style.setProperty('--acl-color-danger-active', danger.active);

    document.documentElement.style.setProperty('--acl-color-text-default', text.default);
    document.documentElement.style.setProperty('--acl-color-text-reverse', text.reverse);

    document.documentElement.style.setProperty('--acl-color-state-focus-inner', background.default);
    document.documentElement.style.setProperty('--acl-color-state-focus-outer', primary.default);
  });

  /*
  Private readonly getContrastEvenChroma = (contrast: number): number => {
    const constant = {
      maxChroma: 1,
      hueLength: 360,
    } as const;

    return Math.min(
      ...Array.from(
        { length: constant.hueLength },
        (_, hue) => getApcachUtils(this.background950Hex(), contrast, constant.maxChroma, hue).chroma,
      ),
    );
  };

  private readonly getSemanticEvenChroma = (): number => {
    const constant = {
      maxChroma: 1,
    } as const;

    return Math.min(
      ...Object.values(this.aclColorToken.semanticHue).map(
        (hue) =>
          getApcachUtils(this.backgroundInputHex(), this.aclColorToken.contrast.semantic, constant.maxChroma, hue)
            .chroma,
      ),
    );
  };

  private readonly constant = {
    evenChroma65: this.getContrastEvenChroma(this.aclColorToken.contrast.default),
    evenChroma75: this.getContrastEvenChroma(this.aclColorToken.contrast.hover),
    evenChroma80: this.getContrastEvenChroma(this.aclColorToken.contrast.active),
    semantic: this.getSemanticEvenChroma(),
  } as const;

  public constructor() {
    this.constant;
    console.log(formatCss(this.background950()));
    console.log(this.color());
  }
   */
}
