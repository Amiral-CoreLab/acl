declare module 'apcach' {
  export type Alpha = number;
  export type Chroma = number;
  export type Contrast = number;
  export type Hue = number;
  export type Lightness = number;

  export type Background = string;

  export type ColorSpace = 'srgb' | 'p3';
  export type ContrastModel = 'apca' | 'wcag';
  export type ForegroundColor = 'apcach';
  export type SearchDirection = 'lighter' | 'darker' | 'auto';

  export type maxChromaFn = () => number;

  export interface ContrastConfig<
    A extends Background,
    B extends Contrast,
    C extends ContrastModel,
    D extends SearchDirection,
  > {
    bgColor: A;
    contrastModel: C;
    cr: B;
    fgColor: ForegroundColor;
    searchDirection: D;
  }

  export interface Apcach {
    alpha: Alpha;
    chroma: Chroma;
    colorSpace: ColorSpace;
    contrastConfig: ContrastConfig;
    hue: Hue;
    lightness: Lightness;
  }

  export function maxChroma(chromaCap: Chroma): maxChromaFn;

  export function apcach(
    background: ContrastConfig,
    chroma: maxChromaFn,
    hue: Hue,
    alpha: Alpha,
    colorSpace: ColorSpace,
  ): Apcach;

  export function apcachToCss(color: Apcach, format: 'oklch' | 'rgb' | 'hex' | 'p3' | 'figma-p3'): string;
}
