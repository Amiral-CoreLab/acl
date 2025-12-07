import { readFile } from 'node:fs/promises';

export const getPngSizeUtil = async (
  path: string,
): Promise<{
  width: number;
  height: number;
}> => {
  const buffer = await readFile(path);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  return { width, height };
};
