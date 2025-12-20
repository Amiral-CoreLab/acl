import { consoleUtil } from '../utils';
import { exit } from 'node:process';

export class ToolConsole {
  private readonly startTime;
  private readonly toolName;

  public constructor(toolName: string) {
    this.startTime = Date.now();
    this.toolName = toolName;
    consoleUtil(`${toolName} (Tool): Starting`, 'information');
  }

  public readonly log = (msg: string): void => {
    consoleUtil(`${this.toolName}: ${msg}`, 'log');
  };

  public readonly end = (): void => {
    const time = (Date.now() - this.startTime) / 1000;

    consoleUtil(`${this.toolName}: Finished in ${time}s`, 'information');

    exit(0);
  };
}
