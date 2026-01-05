import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import type { ComponentsConfig } from '../figma/shared';
import { generateFileUtil, pathsConstant, readdirUtil, ToolConsole } from '../shared';
import { toKebabCase } from '@core';
import { getStoryUtil } from './shared';

const toolConsole = new ToolConsole('🧪 Figma Artifacts · Specs');

const componentsConfig = (await readFile(`${pathsConstant.artifactsFigma}/components.json`, 'utf8').then(
  JSON.parse,
)) as ComponentsConfig;

for (const componentName of componentsConfig) {
  const kebabName = toKebabCase(componentName);
  const artifactPath = `artifacts/figma/specs/${kebabName}`;
  const componentPath = `${pathsConstant.lib}/components/${kebabName}`;
  const storiesPath = `${componentPath}/${kebabName}.component.stories.ts`;
  const specs = (await readdirUtil(artifactPath)) ?? [];

  await rm(`${componentPath}/specs`, { recursive: true, force: true });
  await mkdir(`${componentPath}/specs/base`, { recursive: true });

  for (const spec of specs) {
    await copyFile(`${artifactPath}/${spec}`, `${componentPath}/specs/base/${spec}`);
  }

  const storiesContent = await readFile(storiesPath, 'utf8');

  const storiesNewSpecs = specs
    .map((x) => x.replace('.png', ''))
    .filter((x) => !storiesContent.includes(`Spec${x}`))
    .map(getStoryUtil)
    .join('\n\n');

  if (storiesNewSpecs.length === 0) {
    continue;
  }

  const storiesContentUpdated = `${storiesContent}
${storiesNewSpecs}
`;

  await generateFileUtil(storiesPath, storiesContentUpdated, {
    header: false,
    overwrite: true,
  });
}

toolConsole.end();
