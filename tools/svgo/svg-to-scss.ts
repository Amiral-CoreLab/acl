import { readdirSync, readFileSync } from 'node:fs';
import { consoleUtil, generateFileUtil, pathsConstant } from '../shared';

const startTime = Date.now();

consoleUtil('SVG TO CSS: Starting', 'information');

const encodeSvg = (svg: string): string =>
  svg
    .replace(/"/gu, `'`)
    .replace(/#/gu, '%23')
    .replace(/\{/gu, '%7B')
    .replace(/\}/gu, '%7D')
    .replace(/</gu, '%3C')
    .replace(/>/gu, '%3E');

const getScssContent = (icons: Record<string, string>): string => `:root {
  ${Object.entries(icons)
    .map(([key, value]) => `--acl-icon-${key}: ${value};`)
    .join('\n  ')}
}
`;

const getTypeContent = (icons: Record<string, string>): string => `export type IconType =
  ${Object.keys(icons)
    .map((key) => `| '${key}'`)
    .join('\n  ')};
`;

const getConstantContent = (icons: Record<string, string>): string => `export const iconConstant = [
  ${Object.keys(icons)
    .map((key) => `'${key}',`)
    .join('\n  ')}
];
`;

const iconMap = Object.fromEntries(
  readdirSync(pathsConstant.icons).map((iconFilename) => [
    iconFilename.replace('.svg', ''),
    `url("data:image/svg+xml,${encodeSvg(readFileSync(`${pathsConstant.icons}/${iconFilename}`, { encoding: 'utf8' }).trim())}")`,
  ]),
);

await generateFileUtil(`${pathsConstant.libStyles}/_icons.scss`, getScssContent(iconMap), { overwrite: true });
await generateFileUtil(`${pathsConstant.libComponentsIcon}/icon.type.ts`, getTypeContent(iconMap), { overwrite: true });
await generateFileUtil(`${pathsConstant.libComponentsIcon}/icon.constant.ts`, getConstantContent(iconMap), {
  overwrite: true,
});

const time = (Date.now() - startTime) / 1000;

consoleUtil(`SVG TO CSS: Finished in ${time}s`, 'information');
