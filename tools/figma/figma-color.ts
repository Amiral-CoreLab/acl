import { assert, toKebabCase } from '@core';
import type { GetFileNodesResponse, GetFileStylesResponse } from '@figma/rest-api-spec';
import { formatHex8 } from 'culori';
import { figmaFetchUtil, getNodesUrlUtil } from './shared';
import { generateFileUtil, getEnvUtil, pathsConstant, ToolConsole } from '../shared';

const toolConsole = new ToolConsole('Figma Color');
const { FIGMA_FILE_KEY } = getEnvUtil('FIGMA_FILE_KEY');
const fileStyles = await figmaFetchUtil<GetFileStylesResponse>(
  `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/styles`,
);

toolConsole.log(`'fileStyles' fetch ok!`);

const fillStyles = fileStyles.meta.styles.filter((x) => x.style_type === 'FILL');
const fileNodes = await figmaFetchUtil<GetFileNodesResponse>(getNodesUrlUtil(fillStyles.map((x) => x.node_id)));

toolConsole.log(`'fileNodes' fetch ok!`);

const colors = Object.entries(fileNodes.nodes)
  .map(([id, obj]) => {
    const fillStyleName = fillStyles.find((x) => x.node_id === id)?.name;

    assert(fillStyleName !== undefined, `Node ${id} has no color associated.`);

    const colorName = toKebabCase(fillStyleName);
    const type: 'light' | 'dark' = colorName.startsWith('light') ? 'light' : 'dark';
    // @ts-expect-error bad typing from Figma
    const { r, g, b, a } = obj.document.fills[0].color as { r: number; g: number; b: number; a: number };
    const hex = formatHex8({ mode: 'rgb', r, g, b, alpha: a });

    return { type, name: colorName.replace(`${type}-`, ''), hex };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

const lightThemeScss = `@mixin theme-light() {
  ${colors
    .filter(({ type }) => type === 'light')
    .map(({ name, hex }) => `--acl-color-${name}: ${hex};`)
    .join('\n  ')}
}
`;

const darkThemeScss = `@mixin theme-dark() {
  ${colors
    .filter(({ type }) => type === 'dark')
    .map(({ name, hex }) => `--acl-color-${name}: ${hex};`)
    .join('\n  ')}
}
`;

const colorScss = `${colors
  .filter(({ type }) => type === 'light')
  .map(({ name, hex }) => `$${name}: ${hex} !default;`)
  .join('\n')}
`;

await generateFileUtil(`${pathsConstant.libStylesThemes}/_theme-light.scss`, lightThemeScss, { overwrite: true });
await generateFileUtil(`${pathsConstant.libStylesThemes}/_theme-dark.scss`, darkThemeScss, { overwrite: true });
await generateFileUtil(`${pathsConstant.libStyles}/_color.scss`, colorScss, { overwrite: true });

toolConsole.end();
