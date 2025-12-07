import { getEnvUtil, ToolConsole } from '../shared';
import { assert, sleep } from '@core';

const toolConsole = new ToolConsole('Github wait ci rerun');

const { WORKFLOW_ID, GITHUB_TOKEN, GITHUB_REPOSITORY } = getEnvUtil('WORKFLOW_ID', 'GITHUB_TOKEN', 'GITHUB_REPOSITORY');

interface WorkflowRun {
  status: string;
  conclusion: string | null;
}

const getLatestDispatchRun = async (): Promise<WorkflowRun | undefined> => {
  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/workflows/${WORKFLOW_ID}/runs?per_page=1`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const json = (await res.json()) as {
    workflow_runs?: WorkflowRun[];
  };

  return json.workflow_runs?.[0];
};

let loop = true;
let count = 0;

while (loop) {
  count += 1;

  const run = await getLatestDispatchRun();

  if (!run) {
    await sleep(5000);
    continue;
  }

  const { status, conclusion } = run;

  toolConsole.log(`try:${count} | status=${status} - conclusion=${conclusion}`);

  if (status !== 'completed') {
    await sleep(5000);
    continue;
  }

  loop = false;
  assert(conclusion === 'success', '❌ Rerun failed');
}

toolConsole.end();
