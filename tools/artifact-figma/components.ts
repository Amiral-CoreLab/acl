import { readFile } from 'node:fs/promises';
import type { ComponentsConfig } from '../figma/shared';
import { generateFileUtil, pathsConstant, ToolConsole } from '../shared';
import { getHtmlFileUtil, getScssFileUtil, getStoriesFileUtil, getTsFileUtil } from './shared';
import { toKebabCase } from '@core';

const toolConsole = new ToolConsole('🧩 Figma Artifacts · Components');

const componentsConfig = (await readFile(`${pathsConstant.artifactsFigma}/components.json`, 'utf8').then(
  JSON.parse,
)) as ComponentsConfig;

for (const componentName of componentsConfig) {
  const kebabName = toKebabCase(componentName);

  await generateFileUtil(
    `${pathsConstant.lib}/components/${kebabName}/${kebabName}.component.ts`,
    getTsFileUtil(componentName),
    {
      header: false,
    },
  );

  await generateFileUtil(
    `${pathsConstant.lib}/components/${kebabName}/${kebabName}.component.html`,
    getHtmlFileUtil(componentName),
    {
      header: false,
    },
  );

  await generateFileUtil(
    `${pathsConstant.lib}/components/${kebabName}/${kebabName}.component.scss`,
    getScssFileUtil(componentName),
    {
      header: false,
    },
  );

  await generateFileUtil(
    `${pathsConstant.lib}/components/${kebabName}/${kebabName}.component.stories.ts`,
    getStoriesFileUtil(componentName),
    {
      header: false,
    },
  );
}

toolConsole.end();
