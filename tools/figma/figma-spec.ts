import { readdir, readFile, writeFile } from 'node:fs/promises';
import { assert, capitalize, isNotUndefined, roundTo, toKebabCase } from '@core';
import { exit } from 'node:process';
import { chromium, firefox, webkit } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { generateFileUtil, ToolConsole } from '../shared';

const toolConsole = new ToolConsole('Figma spec');
const componentsPath = 'libs/@amiral-corelab/acl/src/lib/components';
const specFiles = (
  await Promise.all(
    (await readdir(componentsPath, { withFileTypes: true }))
      .filter((x) => x.isDirectory())
      .map((x) => x.name)
      .map(async (componentFolder) => {
        try {
          return await readdir(`${componentsPath}/${componentFolder}/spec`, { withFileTypes: true });
        } catch {
          return undefined;
        }
      }),
  )
)
  .filter(isNotUndefined)
  .flat()
  .filter((x) => x.name.endsWith('.png') && !x.name.endsWith('.spec.png') && !x.name.endsWith('.diff.png'));

if (specFiles.length === 0) {
  exit(0);
}

const specMdx: Record<
  string,
  Record<
    string,
    {
      browserName: string;
      diffPercentage: number;
      baseline: string;
      actual: string;
      diff: string;
    }[]
  >
> = {};

let error: unknown;

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

    for (const specFile of specFiles) {
      const componentId = specFile.parentPath.replace(`${componentsPath}/`, '').replace('/spec', '');
      const specId = toKebabCase(specFile.name.replace('.png', ''));

      await page.goto(
        `http://localhost:6006/iframe.html?globals=&args=&id=components-${componentId}--spec-${specId}&viewMode=story`,
      );

      const el = page.locator('storybook-root');
      const elBoundingBox = await el.boundingBox();

      assert(elBoundingBox !== null, 'Element not found');

      const baselineName = specFile.name;
      const actualName = specFile.name.replace('.png', `.${browserName}.spec.png`);
      const diffName = specFile.name.replace('.png', `.${browserName}.diff.png`);
      const baselinePath = `${specFile.parentPath}/${baselineName}`;
      const actualPath = `${specFile.parentPath}/${actualName}`;
      const diffPath = `${specFile.parentPath}/${diffName}`;
      const baselinePng = PNG.sync.read(await readFile(baselinePath));

      await page.screenshot({
        path: actualPath,
        clip: {
          x: elBoundingBox.x,
          y: elBoundingBox.y,
          width: baselinePng.width,
          height: baselinePng.height,
        },
      });

      const actualPng = PNG.sync.read(await readFile(actualPath));
      const diffPng = new PNG({ width: baselinePng.width, height: baselinePng.height });
      const diffPercentage = roundTo(
        (pixelmatch(baselinePng.data, actualPng.data, diffPng.data, baselinePng.width, baselinePng.height, {
          threshold: 0.2,
          includeAA: true,
          diffMask: true,
        }) /
          (baselinePng.width * baselinePng.height)) *
          100,
        2,
      );

      await writeFile(diffPath, PNG.sync.write(diffPng));

      const mdxPath = specFile.parentPath.replace('libs/@amiral-corelab/acl/src/', '').replace('/spec', '');
      const baseLineTitle = baselineName.replace('.png', '');

      let mdx1 = specMdx[componentId];

      if (!mdx1) {
        mdx1 = specMdx[componentId] = {};
      }

      let mdx2 = mdx1[baseLineTitle];

      if (!mdx2) {
        mdx2 = mdx1[baseLineTitle] = [];
      }

      mdx2.push({
        browserName,
        diffPercentage,
        baseline: `${mdxPath}/spec/${baselineName}`,
        actual: `${mdxPath}/spec/${actualName}`,
        diff: `${mdxPath}/spec/${diffName}`,
      });

      toolConsole.log(`${capitalize(browserName)} - ${componentId} - ${specId} (${100 - diffPercentage}%)`);
    }
  } catch (e) {
    error = e;
  }

  await browser?.close();
}

if (error instanceof Error) {
  throw error;
} else if (Boolean(error)) {
  throw new Error(String(error));
}

for (const [componentId, specs] of Object.entries(specMdx)) {
  let mdxContent = `import { Meta } from '@storybook/addon-docs/blocks';

<Meta title="Specs/Components/${componentId}" />

# ${componentId}

`;

  for (const [specTitle, browser] of Object.entries(specs)) {
    mdxContent += `## ${specTitle}

`;

    for (const { browserName, diffPercentage, baseline, actual, diff } of browser) {
      mdxContent += `### ${browserName} (${100 - diffPercentage}%)

![Baseline ${browserName} frame](${baseline})
![Actual ${browserName} frame](${actual})
![Diff ${browserName} mask](${diff})

`;
    }
  }

  await generateFileUtil(`${componentsPath}/${componentId}/${componentId}.spec.mdx`, mdxContent, {
    overwrite: true,
    header: false,
  });

  toolConsole.log(`${componentId}.spec.mdx saved!`);
}

toolConsole.end();
