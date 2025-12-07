import { cpus } from 'node:os';
import type { Background } from 'apcach';
import { Worker } from 'node:worker_threads';
import type {
  ColorMapType,
  ContrastChromaMapType,
  ContrastRangeType,
  HueRangeType,
  WorkerDataColorInModel,
  WorkerDataColorOutModel,
} from '../structures';
import { splitListUtils } from './split-list.utils';

export const getColorMapUtil = async (
  contrastRange: ContrastRangeType,
  hueRange: HueRangeType,
  backgroundColor: Background,
  evenChromaMap: ContrastChromaMapType,
): Promise<ColorMapType> => {
  const threadCount = Math.min(32, Math.max(1, cpus().length));
  const workerPromises = splitListUtils(hueRange, threadCount).map(async (chunk) => {
    const workerDataIn: WorkerDataColorInModel = {
      contrastRange,
      hueRange: chunk,
      backgroundColor,
      evenChromaMap,
    };

    const worker = new Worker('./tools/color/harmonizer/workers/color.worker.ts', {
      workerData: workerDataIn,
    });

    return new Promise<WorkerDataColorOutModel>((resolve) => {
      worker.on('message', resolve);
    });
  });

  const res = await Promise.all(workerPromises);
  const colorMap: ColorMapType = {};
  Object.assign(colorMap, ...res.map((x) => x.colorMap));

  return colorMap;
};
