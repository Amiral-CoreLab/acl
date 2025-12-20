import { assert, toKebabCase } from '@core';
import type { GetFileNodesResponse, GetFileStylesResponse } from '@figma/rest-api-spec';
import { formatHex8 } from 'culori';
import type { ColorModel, ColorsConfig } from './shared';
import { figmaFetchUtil, getNodesUrlUtil } from './shared';
import { generateFileUtil, getEnvUtil, pathsConstant, ToolConsole } from '../shared';

const toolConsole = new ToolConsole('🎨 Figma · Colors');
const { FIGMA_FILE_KEY } = getEnvUtil('FIGMA_FILE_KEY');

const fileStyles = await figmaFetchUtil<GetFileStylesResponse>(
  `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/styles`,
);

toolConsole.log(`'fileStyles' fetch ok!`);

const fillStyles = fileStyles.meta.styles.filter((x) => x.style_type === 'FILL');
const fileNodes = await figmaFetchUtil<GetFileNodesResponse>(getNodesUrlUtil(fillStyles.map((x) => x.node_id)));

toolConsole.log(`'fileNodes' fetch ok!`);

const colorsConfig: ColorsConfig = Object.entries(fileNodes.nodes)
  .map<ColorModel>(([id, obj]) => {
    const fillStyleName = fillStyles.find((x) => x.node_id === id)?.name;

    assert(fillStyleName !== undefined, `Node ${id} has no color associated.`);

    const colorName = toKebabCase(fillStyleName);
    const type: 'light' | 'dark' = colorName.startsWith('light') ? 'light' : 'dark';
    // @ts-expect-error bad typing from Figma
    const { r, g, b, a } = obj.document.fills[0].color as { r: number; g: number; b: number; a: number };
    const hex = formatHex8({ mode: 'rgb', r, g, b, alpha: a });

    return { type, name: colorName.replace(`${type}-`, ''), hex };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

await generateFileUtil(`${pathsConstant.artifactsFigma}/colors.json`, JSON.stringify(colorsConfig), {
  overwrite: true,
  header: false,
});

toolConsole.end();
