import { config } from 'dotenv';
import { assert } from '@core';

config({ quiet: true });

export const getEnvUtil = <T extends string>(...variables: T[]): Record<T, string> => {
  const map = Object.fromEntries(variables.map((variable) => [variable, process.env[variable]]));

  for (const [key, value] of Object.entries(map)) {
    assert(value !== undefined, `Environment variable ${key} doesn't exist!`);
  }

  return map as Record<T, string>;
};
