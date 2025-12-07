import { parentPort, workerData } from 'node:worker_threads';
import type { WorkerDataEvenChromaInModel, WorkerDataEvenChromaOutModel } from '../structures';
// @ts-expect-error This import is valid at runtime for workers.
import { assert } from '../../../../core/assert.ts';
// @ts-expect-error This import is valid at runtime for workers.
import { getApcachUtils } from '../utils/get-apcach.utils.ts';

assert(parentPort !== null);

const { contrastRange, hueRange, backgroundColor } = workerData as WorkerDataEvenChromaInModel;

const workerDataOut: WorkerDataEvenChromaOutModel = {
  evenChromaMap: Object.fromEntries(
    contrastRange.map((contrast) => [
      contrast,
      Math.min(...hueRange.map((hue) => getApcachUtils(backgroundColor, contrast, 1, hue).chroma)),
    ]),
  ),
};

parentPort.postMessage(workerDataOut);
