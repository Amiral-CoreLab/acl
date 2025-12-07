import { getColorMapUtil, getEvenChromaMap } from './utils';
import { SteppedRange } from '@core';
import { consoleUtil, generateFileUtil } from '../../shared';

const startTime = Date.now();

consoleUtil('Harmonizer: Starting', 'information');

const contrastRange = SteppedRange(0, 1, 100);
const hueRange = SteppedRange(1, 1, 360);
const backgroundColor = '#F2F0EB';
const evenChromaMap = await getEvenChromaMap(contrastRange, hueRange, backgroundColor);

consoleUtil(`Harmonizer: 'evenChromaMap' done!`, 'log');

const colorMap = await getColorMapUtil(contrastRange, hueRange, backgroundColor, evenChromaMap);

consoleUtil(`Harmonizer: 'colorMap' done!`, 'log');

await generateFileUtil(
  'generated/_harmonizer.scss',
  Object.entries(colorMap)
    .flatMap(([hue, obj]) =>
      Object.entries(obj).map(
        ([contrast, { even, max }]) =>
          `$even${hue.padStart(3, '0')}${contrast.padStart(3, '0')}: ${even};\n$max${hue.padStart(3, '0')}${contrast.padStart(3, '0')}: ${max};`,
      ),
    )
    .join('\n'),
  { overwrite: true },
);

const time = (Date.now() - startTime) / 1000;

consoleUtil(`Harmonizer: Finished in ${time}s`, 'information');
