import { readdir } from 'node:fs/promises';

export const readdirUtil = async (path: string): Promise<string[] | undefined> => {
  try {
    return await readdir(path);
  } catch {
    return undefined;
  }
};
