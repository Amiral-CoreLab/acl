import { generateFileUtil, pathsConstant, ToolConsole } from '../shared';
import { readdir, readFile } from 'node:fs/promises';

const toolConsole = new ToolConsole('🖼️ Figma Artifacts · Icons');
const iconPath = `${pathsConstant.artifactsFigma}/icons`;
const icons = (await readdir(iconPath)).map((iconFilename) => iconFilename.replace('.svg', ''));

const getScssContent = `:root {
  ${(
    await Promise.all(
      icons.map(async (icon) => {
        const isonContent = await readFile(`${iconPath}/${icon}.svg`, { encoding: 'utf8' });
        return `--acl-icon-${icon}: url("data:image/svg+xml,${encodeURIComponent(isonContent.trim())}");`;
      }),
    )
  ).join('\n  ')}
}
`;

const getTypeContent = `export type IconType =
  ${icons.map((icon) => `| '${icon}'`).join('\n  ')};
`;

const getConstantContent = `export const iconConstant = [
  ${icons.map((icon) => `'${icon}',`).join('\n  ')}
];
`;

await generateFileUtil(`${pathsConstant.lib}/styles/_icons.scss`, getScssContent, { overwrite: true });

await generateFileUtil(`${pathsConstant.lib}/components/icon/icon.type.ts`, getTypeContent, {
  overwrite: true,
});

await generateFileUtil(`${pathsConstant.lib}/components/icon/icon.constant.ts`, getConstantContent, {
  overwrite: true,
});

toolConsole.end();
