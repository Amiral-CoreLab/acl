import { readFile } from 'node:fs/promises';
import type { TyposConfig } from '../figma/shared';
import { generateFileUtil, pathsConstant, ToolConsole } from '../shared';

const toolConsole = new ToolConsole('✒️ Figma Artifacts · Typography');

const typosConfig = (await readFile(`${pathsConstant.artifactsFigma}/typos.json`, 'utf8').then(
  JSON.parse,
)) as TyposConfig;

const fontScss = `@use 'sass:map';
@use '@ibm/plex-sans/scss' as PlexSans with (
  $font-prefix: '~@ibm/plex-sans'
);
@include PlexSans.all;

$typography: (
  ${typosConfig
    .map(
      ({ name, fontFamily, fontSize, fontWeight, lineHeightPercentFontSize }) => `${name}: (
    font-family: '${fontFamily}',
    font-size: ${fontSize / 16}rem,
    font-weight: ${fontWeight},
    line-height: ${lineHeightPercentFontSize / 100}em,
  ),`,
    )
    .join('\n  ')}
) !default;

@mixin typography($style) {
  $config: map.get($typography, $style);

  font-size: map.get($config, font-size);
  font-weight: map.get($config, font-weight);
  line-height: map.get($config, line-height);
}

:root {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 16px;
}
`;

await generateFileUtil(`${pathsConstant.lib}/styles/_font.scss`, fontScss, {
  overwrite: true,
});

toolConsole.end();
