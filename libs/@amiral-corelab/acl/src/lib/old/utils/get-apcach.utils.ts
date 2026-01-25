import type { Alpha, Apcach, Background, Chroma, Contrast, Hue } from 'apcach';
import { apcach, maxChroma } from 'apcach';

export const getApcachUtils = (
  backgroundColor: Background,
  contrast: Contrast,
  chroma: Chroma,
  hue: Hue,
  alpha: Alpha = 100,
): Apcach =>
  apcach(
    {
      bgColor: backgroundColor,
      contrastModel: 'apca',
      cr: contrast,
      fgColor: 'apcach',
      searchDirection: 'auto',
    },
    maxChroma(chroma),
    hue,
    alpha,
    'srgb',
  );
