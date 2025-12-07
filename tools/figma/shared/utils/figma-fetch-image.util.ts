import { generateFileUtil } from '../../../shared';

export const figmaFetchImageUtil = async (url: string, path: string, type: 'svg' | 'png'): Promise<void> => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = type === 'svg' ? await res.text() : Buffer.from(await res.arrayBuffer());

  await generateFileUtil(path, data, { overwrite: true, header: false });
};
