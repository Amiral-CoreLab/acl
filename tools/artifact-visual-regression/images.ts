import { pathsConstant, ToolConsole } from '../shared';
import { cp, readFile } from 'node:fs/promises';
import type { VisualRegressionConfig } from '../visual-regression/shared';

const toolConsole = new ToolConsole('🖼️ Visual Regression Artifacts · Images');

const visualRegressionConfig = (await readFile(
  `${pathsConstant.artifactsVisualRegression}/visual-regression.json`,
  'utf8',
).then(JSON.parse)) as VisualRegressionConfig;

for (const [componentId, specs] of Object.entries(visualRegressionConfig)) {
  const pass = Object.values(specs)
    .flatMap((x) => x)
    .every((x) => x.percentage === 100);

  if (pass) {
    continue;
  }

  // eslint-disable-next-line @angular-eslint/no-experimental
  await cp(
    `${pathsConstant.artifactsVisualRegression}/${componentId}`,
    `${pathsConstant.lib}/components/${componentId}`,
    {
      recursive: true,
      force: true,
    },
  );
}

toolConsole.end();
