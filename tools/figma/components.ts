import type { GetFileComponentsResponse } from '@figma/rest-api-spec';
import type { ComponentsConfig } from './shared';
import { figmaFetchUtil } from './shared';
import { generateFileUtil, getEnvUtil, pathsConstant, ToolConsole } from '../shared';

const toolConsole = new ToolConsole('🧩 Figma · Components');
const { FIGMA_FILE_KEY } = getEnvUtil('FIGMA_FILE_KEY');

const fileComponents = await figmaFetchUtil<GetFileComponentsResponse>(
  `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/components`,
);

toolConsole.log(`'fileComponents' fetch ok!`);

const componentsConfig: ComponentsConfig = [
  ...new Set(
    fileComponents.meta.components
      .filter((x) => x.containing_frame?.pageName === 'Components' || Boolean(x.containing_frame?.name))
      .map((x) => x.containing_frame?.name ?? x.name),
  ),
];

await generateFileUtil(`${pathsConstant.artifactsFigma}/components.json`, JSON.stringify(componentsConfig), {
  overwrite: true,
  header: false,
});

toolConsole.end();
