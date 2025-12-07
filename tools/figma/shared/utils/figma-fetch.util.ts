import { config } from 'dotenv';
import { assert, sleep } from '@core';

config();

const { FIGMA_ACCESS_TOKEN } = process.env;

assert(FIGMA_ACCESS_TOKEN !== undefined, 'FIGMA_ACCESS_TOKEN is not set!');

export const figmaFetchUtil = async <T>(url: string): Promise<T> => {
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(url, {
      headers: {
        'X-Figma-Token': FIGMA_ACCESS_TOKEN,
      },
    });

    if (res.status !== 429) {
      if (!res.ok) {
        throw new Error(await res.text());
      }

      return (await res.json()) as T;
    }

    const retryAfterSec = Number(res.headers.get('retry-after')) || 1;

    await sleep(retryAfterSec * 1000);
  }

  throw new Error(`429 Too Many Requests after 5 attempts (${url}).`);
};
