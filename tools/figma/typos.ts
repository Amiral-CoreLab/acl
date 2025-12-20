import type { BaseTypeStyle, GetFileNodesResponse, GetFileStylesResponse } from '@figma/rest-api-spec';
import type { TypoModel, TyposConfig } from './shared';
import { figmaFetchUtil, getNodesUrlUtil } from './shared';
import { generateFileUtil, getEnvUtil, pathsConstant, ToolConsole } from '../shared';

const toolConsole = new ToolConsole('✒️ Figma · Typography');
const { FIGMA_FILE_KEY } = getEnvUtil('FIGMA_FILE_KEY');

const fileStyles = await figmaFetchUtil<GetFileStylesResponse>(
  `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/styles`,
);

toolConsole.log(`'fileStyles' fetch ok!`);

const fillStyles = fileStyles.meta.styles.filter((x) => x.style_type === 'TEXT');
const fileNodes = await figmaFetchUtil<GetFileNodesResponse>(getNodesUrlUtil(fillStyles.map((x) => x.node_id)));

toolConsole.log(`'fileNodes' fetch ok!`);

const typosConfig: TyposConfig = Object.entries(fileNodes.nodes)
  .map<BaseTypeStyle>(
    // @ts-expect-error bad typing from Figma
    ([key, x]) => ({ ...x.document.style, fontStyle: fileNodes.nodes[key].document.name }) as BaseTypeStyle,
  )
  // @ts-expect-error bad typing from Figma
  .map<TypoModel>(({ fontStyle, fontFamily, fontSize, fontWeight, lineHeightPercentFontSize }) => ({
    name: String(fontStyle),
    fontFamily: String(fontFamily),
    fontSize: Number(fontSize),
    fontWeight: Number(fontWeight),
    lineHeightPercentFontSize: Number(lineHeightPercentFontSize),
  }));

await generateFileUtil(`${pathsConstant.artifactsFigma}/typos.json`, JSON.stringify(typosConfig), {
  overwrite: true,
  header: false,
});

toolConsole.end();
