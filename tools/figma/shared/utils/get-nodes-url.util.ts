import { getEnvUtil } from '../../../shared';

const { FIGMA_FILE_KEY } = getEnvUtil('FIGMA_FILE_KEY');

export const getNodesUrlUtil = (ids: string[]): string => {
  const nodesUrl = new URL(`https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes`);
  nodesUrl.search = new URLSearchParams({
    ids: ids.join(','),
  }).toString();

  return nodesUrl.toString();
};
