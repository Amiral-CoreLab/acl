import { getEnvUtil, ToolConsole } from '../shared';
import { sleep } from '@core';

const toolConsole = new ToolConsole('Github wait on');

const { URL } = getEnvUtil('URL');

let loop = true;
let count = 0;

while (loop) {
  count += 1;

  try {
    toolConsole.log(`${URL} | try:${count}`);
    const res = await fetch(URL);

    if (!res.ok) {
      await sleep(5000);
      continue;
    }
  } catch {
    await sleep(5000);
    continue;
  }

  loop = false;
}

toolConsole.end();
