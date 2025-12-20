import { generateFileUtil, pathsConstant, ToolConsole } from '../shared';
import { readFile } from 'node:fs/promises';
import type { VisualRegressionConfig } from '../visual-regression/shared';

const toolConsole = new ToolConsole('📊 Visual Regression Artifacts · Report');

const visualRegressionConfig = (await readFile(
  `${pathsConstant.artifactsVisualRegression}/visual-regression.json`,
  'utf8',
).then(JSON.parse)) as VisualRegressionConfig;

const report = Object.fromEntries(
  Object.entries(visualRegressionConfig).flatMap(([componentId, specs]) =>
    Object.entries(specs).flatMap(([specTitle, browsers]) =>
      browsers.map<[string, number]>(({ browserName, percentage }) => [
        `${componentId}.${specTitle}.${browserName}`,
        percentage,
      ]),
    ),
  ),
);

await generateFileUtil(`${pathsConstant.lib}/../stories/visual-regression.json`, JSON.stringify(report, null, 2), {
  overwrite: true,
  header: false,
});

toolConsole.end();
