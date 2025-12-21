import { assert } from '@core';
import { rm } from 'node:fs/promises';
import type { GetFileComponentsResponse, GetImagesResponse } from '@figma/rest-api-spec';
import { figmaFetchImageUtil, figmaFetchUtil, getImagesUrlUtil } from './shared';
import { getEnvUtil, pathsConstant, ToolConsole } from '../shared';

const toolConsole = new ToolConsole('🖼️ Figma · Icons');
const { FIGMA_FILE_KEY } = getEnvUtil('FIGMA_FILE_KEY');

const fileComponents = await figmaFetchUtil<GetFileComponentsResponse>(
  `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/components`,
);

toolConsole.log(`'fileComponents' fetch ok!`);

const nodeIdNameMap = Object.fromEntries(
  fileComponents.meta.components
    .filter((x) => x.name.startsWith('Icons/'))
    .map((x) => [x.node_id, x.name.replace('Icons/', '').split('/').join('-')]),
);

const images = await figmaFetchUtil<GetImagesResponse>(getImagesUrlUtil(Object.keys(nodeIdNameMap), 'svg'));

toolConsole.log(`'images' fetch ok!`);

await rm(`${pathsConstant.artifactsFigma}/icons`, { recursive: true, force: true });

for (const [id, url] of Object.entries(images.images)) {
  const name = nodeIdNameMap[id];

  assert(name !== undefined, `Image ${id} has no name associated.`);
  assert(url !== null, `Image ${name} has no url.`);
  await figmaFetchImageUtil(url, `${pathsConstant.artifactsFigma}/icons/${name}.svg`, 'svg');
  toolConsole.log(`'${name}.svg' fetch ok!`);
}

toolConsole.end();
