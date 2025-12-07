import chalk from 'chalk';

export type ConsoleMessageType = 'log' | 'information' | 'success' | 'warn' | 'error';

export const consoleUtil = (message: string, type: ConsoleMessageType): void => {
  let msg = message;

  switch (type) {
    case 'log': {
      msg = chalk.grey(msg);
      break;
    }
    case 'information': {
      msg = chalk.blueBright(msg);
      break;
    }
    case 'success': {
      msg = chalk.greenBright(msg);
      break;
    }
    case 'warn': {
      msg = chalk.yellowBright(msg);
      break;
    }
    case 'error': {
      msg = chalk.redBright(msg);
      break;
    }
    default: {
      // Empty
    }
  }

  // eslint-disable-next-line no-console
  console.log(msg);
};
