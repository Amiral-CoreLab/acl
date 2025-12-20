import { getEnvUtil, pathsConstant, ToolConsole } from '../shared';
import { readFile } from 'node:fs/promises';
import { exit } from 'node:process';

const toolConsole = new ToolConsole('👀 Quality Gate · Visual Regression Check');
const { VISUAL_REGRESSION_WARN, VISUAL_REGRESSION_ALERT } = getEnvUtil(
  'VISUAL_REGRESSION_WARN',
  'VISUAL_REGRESSION_ALERT',
);

const visualRegressionReport = (await readFile(`${pathsConstant.lib}/../stories/visual-regression.json`, 'utf8').then(
  JSON.parse,
)) as Record<string, number>;

const hasAlert = Object.values(visualRegressionReport).some(
  (percentage) => percentage < Number(VISUAL_REGRESSION_ALERT),
);
const hasWarn = Object.values(visualRegressionReport).some((percentage) => percentage < Number(VISUAL_REGRESSION_WARN));

if (hasWarn) {
  toolConsole.log('⚠️ Visual regression tests have exceeded the warn threshold.');
}

if (hasAlert) {
  toolConsole.log('🚨 Visual regression tests have exceeded the alert threshold.');
  exit(1);
}

toolConsole.end();
