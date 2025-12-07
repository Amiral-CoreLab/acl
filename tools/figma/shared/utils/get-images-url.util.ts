import { getEnvUtil } from '../../../shared';

const { FIGMA_FILE_KEY } = getEnvUtil('FIGMA_FILE_KEY');

export const getImagesUrlUtil = (ids: string[], format: 'jpg' | 'png' | 'svg' | 'pdf'): string => {
  const nodesUrl = new URL(`https://api.figma.com/v1/images/${FIGMA_FILE_KEY}`);
  nodesUrl.search = new URLSearchParams({
    ids: ids.join(','),
    format,
  }).toString();

  return nodesUrl.toString();
};
