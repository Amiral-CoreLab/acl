import { readFile } from 'node:fs/promises';
import { assert, toKebabCase, toPascalCase } from '@core';
import type {
  DocumentNode,
  FrameNode,
  GetFileComponentsResponse,
  GetFileNodesResponse,
  GetImagesResponse,
} from '@figma/rest-api-spec';
import {
  figmaFetchImageUtil,
  figmaFetchUtil,
  getImagesUrlUtil,
  getNodesUrlUtil,
  getScssFileUtil,
  getStoriesFileUtil,
  getTsFileUtil,
} from './shared';
import { generateFileUtil, getEnvUtil, pathsConstant, ToolConsole } from '../shared';

const toolConsole = new ToolConsole('Figma Component');
const { FIGMA_FILE_KEY, FIGMA_FILE_SPEC_NODE_ID } = getEnvUtil('FIGMA_FILE_KEY', 'FIGMA_FILE_SPEC_NODE_ID');
const fileComponents = await figmaFetchUtil<GetFileComponentsResponse>(
  `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/components`,
);

toolConsole.log(`'fileComponents' fetch ok!`);

const fileNodes = await figmaFetchUtil<GetFileNodesResponse>(getNodesUrlUtil([FIGMA_FILE_SPEC_NODE_ID]));

toolConsole.log(`'fileNodes' fetch ok!`);

const [specNode] = Object.values(fileNodes.nodes);

assert(specNode !== undefined, `The node doesn't exist (${FIGMA_FILE_SPEC_NODE_ID})!`);

const specDocument = specNode.document as DocumentNode;
const specDocumentChildren = specDocument.children as unknown as FrameNode[];
const componentSpecMap = Object.fromEntries(
  specDocumentChildren.map((componentFrame) => [
    componentFrame.name,
    Object.fromEntries(componentFrame.children.map((specFrame) => [specFrame.name, specFrame.id])),
  ]),
);

const images = await figmaFetchUtil<GetImagesResponse>(
  getImagesUrlUtil(
    Object.values(componentSpecMap).flatMap((x) => Object.values(x)),
    'png',
  ),
);

toolConsole.log(`'images' fetch ok!`);

for (const componentName of fileComponents.meta.components
  .filter((x) => x.containing_frame?.pageName === 'Components')
  .map((x) => x.name)) {
  const componentNameKebab = toKebabCase(componentName);
  const storiesPath = `${pathsConstant.libComponents}/${componentNameKebab}/${componentNameKebab}.component.stories.ts`;
  const specMap = componentSpecMap[componentNameKebab] ?? {};
  const specNames = Object.keys(specMap);

  for (const [imageName, imageUrl] of Object.entries(specMap).map<[string, string | null | undefined]>(
    ([key, value]) => [key, images.images[value]],
  )) {
    if (imageUrl === null || imageUrl === undefined) {
      continue;
    }

    await figmaFetchImageUtil(
      imageUrl,
      `${pathsConstant.libComponents}/${componentNameKebab}/spec/${imageName}.png`,
      'png',
    );
  }

  await generateFileUtil(storiesPath, getStoriesFileUtil(componentName, specNames), {
    header: false,
  });

  let storiesContent = await readFile(storiesPath, { encoding: 'utf8' });
  const missingSpecNames: string[] = [];

  for (const specName of specNames) {
    if (storiesContent.includes(specName)) {
      continue;
    }

    missingSpecNames.push(specName);
  }

  if (missingSpecNames.length) {
    const notIncludeStories = missingSpecNames
      .map((specName) => `export const Spec${toPascalCase(specName)}: Story = {};`)
      .join('\n\n');

    storiesContent += `\n${notIncludeStories}\n`;

    await generateFileUtil(storiesPath, storiesContent, {
      header: false,
      overwrite: true,
    });
  }

  await generateFileUtil(
    `${pathsConstant.libComponents}/${componentNameKebab}/${componentNameKebab}.component.ts`,
    getTsFileUtil(componentName),
    {
      header: false,
    },
  );

  await generateFileUtil(
    `${pathsConstant.libComponents}/${componentNameKebab}/${componentNameKebab}.component.html`,
    '',
    {
      header: false,
    },
  );

  await generateFileUtil(
    `${pathsConstant.libComponents}/${componentNameKebab}/${componentNameKebab}.component.scss`,
    getScssFileUtil(componentName),
    {
      header: false,
    },
  );
}

toolConsole.end();
