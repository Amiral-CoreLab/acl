import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { assert, capitalize, roundTo, toKebabCase } from '@core';
import { chromium, firefox, webkit } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { generateFileUtil, pathsConstant, ToolConsole } from '../shared';
import type { VisualRegressionConfig } from './shared';

const toolConsole = new ToolConsole('👀 Visual Regression · Test');
const componentsPath = `${pathsConstant.lib}/components`;

const baseFiles = (
  await Promise.all(
    (await readdir(componentsPath, { withFileTypes: true }))
      .filter((x) => x.isDirectory())
      .map((x) => x.name)
      .map(async (componentFolder) =>
        readdir(`${componentsPath}/${componentFolder}/specs/base`, { withFileTypes: true }),
      ),
  )
)
  .flat()
  .filter((x) => x.name.endsWith('.png') && !x.name.endsWith('.spec.png') && !x.name.endsWith('.diff.png'));

if (baseFiles.length === 0) {
  toolConsole.end();
}

const visualRegressionConfig: VisualRegressionConfig = {};

for (const browserName of ['chromium', 'firefox', 'webkit'] as const) {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    if (browserName === 'chromium') {
      browser = await chromium.launch();
    } else if (browserName === 'firefox') {
      browser = await firefox.launch();
    } else {
      browser = await webkit.launch();
    }

    toolConsole.log(`${capitalize(browserName)} launched!`);

    const page = await browser.newPage();

    for (const baseFile of baseFiles) {
      const componentId = baseFile.parentPath.replace(`${componentsPath}/`, '').replace('/specs/base', '');
      const baseId = baseFile.name.replace('.png', '');
      const specId = toKebabCase(baseId);

      await page.goto(
        `http://localhost:6006/iframe.html?globals=&args=&id=components-${componentId}--spec-${specId}&viewMode=story`,
      );

      const el = page.locator('storybook-root');
      const elBoundingBox = await el.boundingBox();

      assert(elBoundingBox !== null, 'Element not found');

      const baseName = baseFile.name;
      const specName = baseFile.name.replace('.png', `.${browserName}.spec.png`);
      const diffName = baseFile.name.replace('.png', `.${browserName}.diff.png`);
      const basePath = `${baseFile.parentPath}/${baseName}`;
      const specPath = `${pathsConstant.artifactsVisualRegression}/${componentId}/specs/spec/${specName}`;
      const diffPath = `${pathsConstant.artifactsVisualRegression}/${componentId}/specs/diff/${diffName}`;
      const basePng = PNG.sync.read(await readFile(basePath));

      await page.screenshot({
        path: specPath,
        clip: {
          x: elBoundingBox.x,
          y: elBoundingBox.y,
          width: basePng.width,
          height: basePng.height,
        },
      });

      const specPng = PNG.sync.read(await readFile(specPath));
      const diffPng = new PNG({ width: basePng.width, height: basePng.height });

      const percentage =
        100 -
        roundTo(
          (pixelmatch(basePng.data, specPng.data, diffPng.data, basePng.width, basePng.height, {
            threshold: 0.2,
            includeAA: true,
            diffMask: true,
          }) /
            (basePng.width * basePng.height)) *
            100,
          2,
        );

      if (percentage < 100) {
        await mkdir(`${pathsConstant.artifactsVisualRegression}/${componentId}/specs/diff`, { recursive: true });
        await writeFile(diffPath, PNG.sync.write(diffPng));
      } else {
        await rm(specPath, { recursive: false, force: true });
      }

      let componentLvl = visualRegressionConfig[componentId];

      if (!componentLvl) {
        componentLvl = visualRegressionConfig[componentId] = {};
      }

      let specLvl = componentLvl[baseId];

      if (!specLvl) {
        specLvl = componentLvl[baseId] = [];
      }

      specLvl.push({
        browserName,
        percentage,
        base: `lib/components/${componentId}/specs/base/${baseName}`,
        spec: percentage < 100 ? `lib/components/${componentId}/specs/spec/${specName}` : undefined,
        diff: percentage < 100 ? `lib/components/${componentId}/specs/diff/${diffName}` : undefined,
      });

      toolConsole.log(`${capitalize(browserName)} - ${componentId} - ${specId} (${percentage}%)`);
    }
  } catch (e) {
    toolConsole.log(String(e));
  }

  await browser?.close();
}

await generateFileUtil(
  `${pathsConstant.artifactsVisualRegression}/visual-regression.json`,
  JSON.stringify(visualRegressionConfig),
  {
    overwrite: true,
    header: false,
  },
);

toolConsole.end();
