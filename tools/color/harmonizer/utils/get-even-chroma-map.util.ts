import { cpus } from 'node:os';
import type { Background } from 'apcach';
import { Worker } from 'node:worker_threads';
import type {
  ContrastChromaMapType,
  ContrastRangeType,
  HueRangeType,
  WorkerDataEvenChromaInModel,
  WorkerDataEvenChromaOutModel,
} from '../structures';
import { splitListUtils } from './split-list.utils';

export const getEvenChromaMap = async (
  contrastRange: ContrastRangeType,
  hueRange: HueRangeType,
  backgroundColor: Background,
): Promise<ContrastChromaMapType> => {
  const threadCount = Math.min(32, Math.max(1, cpus().length));
  const workerPromises = splitListUtils(contrastRange, threadCount).map(async (chunk) => {
    const workerDataIn: WorkerDataEvenChromaInModel = {
      contrastRange: chunk,
      hueRange,
      backgroundColor,
    };

    const worker = new Worker('./tools/color/harmonizer/workers/even-chroma.worker.ts', {
      workerData: workerDataIn,
    });

    return new Promise<WorkerDataEvenChromaOutModel>((resolve) => {
      worker.on('message', resolve);
    });
  });

  const res = await Promise.all(workerPromises);
  const evenChromaMap: ContrastChromaMapType = {};
  Object.assign(evenChromaMap, ...res.map((x) => x.evenChromaMap));

  return evenChromaMap;
};
