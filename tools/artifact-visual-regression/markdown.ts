import { generateFileUtil, getEnvUtil, pathsConstant, ToolConsole } from '../shared';
import { readFile } from 'node:fs/promises';
import type { VisualRegressionConfig } from '../visual-regression/shared';

const toolConsole = new ToolConsole('📝 Visual Regression Artifacts · Markdown');
const { VISUAL_REGRESSION_WARN, VISUAL_REGRESSION_ALERT } = getEnvUtil(
  'VISUAL_REGRESSION_WARN',
  'VISUAL_REGRESSION_ALERT',
);

const visualRegressionConfig = (await readFile(
  `${pathsConstant.artifactsVisualRegression}/visual-regression.json`,
  'utf8',
).then(JSON.parse)) as VisualRegressionConfig;

let mdx = `# Viual Regression

`;

for (const [componentId, specs] of Object.entries(visualRegressionConfig)) {
  mdx += `## ${componentId}

`;

  for (const [specTitle, browser] of Object.entries(specs)) {
    mdx += `### ${specTitle}

`;

    for (const { browserName, percentage, base, spec, diff } of browser) {
      const emoji =
        // eslint-disable-next-line no-nested-ternary
        percentage < Number(VISUAL_REGRESSION_ALERT) ? '🚨' : percentage < Number(VISUAL_REGRESSION_WARN) ? '⚠️' : '✅';

      mdx += `#### ${emoji} ${browserName} (${percentage}%)

![Base ${browserName} frame](${base})
`;
      if (spec === undefined || diff === undefined) {
        mdx += `
`;
        continue;
      }

      mdx += `![Spec ${browserName} frame](${spec})
![Diff ${browserName} mask](${diff})

`;
    }
  }

  await generateFileUtil(`${pathsConstant.lib}/../stories/visual-regression.mdx`, mdx, {
    overwrite: true,
    header: false,
  });
}

toolConsole.end();
