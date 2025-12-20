import { ToolConsole } from '../shared';
import { sleep } from '@core';

const toolConsole = new ToolConsole('Github wait on');

const url = 'http://localhost:6006';

let loop = true;
let count = 0;

while (loop) {
  count += 1;

  try {
    toolConsole.log(`${url} | try:${count}`);
    const res = await fetch(url);

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
