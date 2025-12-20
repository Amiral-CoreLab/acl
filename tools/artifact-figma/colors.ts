import { readFile } from 'node:fs/promises';
import type { ColorsConfig } from '../figma/shared';
import { generateFileUtil, pathsConstant, ToolConsole } from '../shared';

const toolConsole = new ToolConsole('🎨 Figma Artifacts · Colors');

const colorsConfig = (await readFile(`${pathsConstant.artifactsFigma}/colors.json`, 'utf8').then(
  JSON.parse,
)) as ColorsConfig;

const lightThemeScss = `@mixin theme-light() {
  ${colorsConfig
    .filter(({ type }) => type === 'light')
    .map(({ name, hex }) => `--acl-color-${name}: ${hex};`)
    .join('\n  ')}
}
`;

const darkThemeScss = `@mixin theme-dark() {
  ${colorsConfig
    .filter(({ type }) => type === 'dark')
    .map(({ name, hex }) => `--acl-color-${name}: ${hex};`)
    .join('\n  ')}
}
`;

const colorScss = `${colorsConfig
  .filter(({ type }) => type === 'light')
  .map(({ name, hex }) => `$${name}: ${hex} !default;`)
  .join('\n')}
`;

await generateFileUtil(`${pathsConstant.lib}/styles/themes/_theme-light.scss`, lightThemeScss, { overwrite: true });
await generateFileUtil(`${pathsConstant.lib}/styles/themes/_theme-dark.scss`, darkThemeScss, { overwrite: true });
await generateFileUtil(`${pathsConstant.lib}/styles/_color.scss`, colorScss, { overwrite: true });

toolConsole.end();
