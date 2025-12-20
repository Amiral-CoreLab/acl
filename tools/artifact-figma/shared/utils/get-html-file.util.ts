import { toKebabCase } from '@core';

export const getHtmlFileUtil = (name: string): string => {
  const kebabName = toKebabCase(name);

  return `${kebabName} component!`;
};
