import { parentPort, workerData } from 'node:worker_threads';
import { apcachToCss } from 'apcach';
import type { WorkerDataColorInModel, WorkerDataColorOutModel } from '../structures';
// @ts-expect-error This import is valid at runtime for workers.
import { assert } from '../../../../core/assert.ts';
// @ts-expect-error This import is valid at runtime for workers.
import { getApcachUtils } from '../utils/get-apcach.utils.ts';

assert(parentPort !== null);

const { contrastRange, hueRange, backgroundColor, evenChromaMap } = workerData as WorkerDataColorInModel;

const workerDataOut: WorkerDataColorOutModel = {
  colorMap: Object.fromEntries(
    hueRange.map((hue) => [
      hue,
      Object.fromEntries(
        contrastRange.map((contrast) => [
          contrast,
          {
            even: apcachToCss(getApcachUtils(backgroundColor, contrast, evenChromaMap[contrast] ?? 1, hue), 'hex'),
            max: apcachToCss(getApcachUtils(backgroundColor, contrast, 1, hue), 'hex'),
          },
        ]),
      ),
    ]),
  ),
};

parentPort.postMessage(workerDataOut);
