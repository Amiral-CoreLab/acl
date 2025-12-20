import type { DocumentNode, FrameNode, GetFileNodesResponse, GetImagesResponse } from '@figma/rest-api-spec';
import { figmaFetchImageUtil, figmaFetchUtil, getImagesUrlUtil, getNodesUrlUtil } from './shared';
import { getEnvUtil, pathsConstant, ToolConsole } from '../shared';
import { assert, toKebabCase } from '@core';

const toolConsole = new ToolConsole('🧪 Figma · Component Specs');
const { FIGMA_FILE_SPEC_NODE_ID } = getEnvUtil('FIGMA_FILE_SPEC_NODE_ID');
const fileNodes = await figmaFetchUtil<GetFileNodesResponse>(getNodesUrlUtil([FIGMA_FILE_SPEC_NODE_ID]));

toolConsole.log(`'fileNodes' fetch ok!`);

const [specNode] = Object.values(fileNodes.nodes);

assert(specNode !== undefined, `The node doesn't exist (${FIGMA_FILE_SPEC_NODE_ID})!`);

const specDocument = specNode.document as DocumentNode;
const specDocumentChildren = specDocument.children as unknown as FrameNode[];

const componentSpecMap = Object.fromEntries(
  specDocumentChildren.flatMap((componentFrame) =>
    componentFrame.children.map<[string, { specName: string; componentName: string }]>((specFrame) => [
      specFrame.id,
      { specName: specFrame.name, componentName: componentFrame.name },
    ]),
  ),
);

const images = await figmaFetchUtil<GetImagesResponse>(getImagesUrlUtil(Object.keys(componentSpecMap), 'png'));

toolConsole.log(`'images' fetch ok!`);

for (const [id, url] of Object.entries(images.images)) {
  const data = componentSpecMap[id];

  assert(data !== undefined, `Image ${id} has no spec associated.`);
  assert(url !== null, `Image ${id} has no url associated.`);

  const componentNameKebab = toKebabCase(data.componentName);

  await figmaFetchImageUtil(
    url,
    `${pathsConstant.artifactsFigma}/specs/${componentNameKebab}/${data.specName}.png`,
    'png',
  );
  toolConsole.log(`'${componentNameKebab}/${data.specName}.png' fetch ok!`);
}

toolConsole.end();
