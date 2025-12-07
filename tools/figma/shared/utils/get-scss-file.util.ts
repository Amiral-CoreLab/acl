import { toKebabCase } from '@core';

export const getScssFileUtil = (name: string): string => {
  const kebabName = toKebabCase(name);

  return `@use '../../styles/component';

@layer component {
  acl-${kebabName} {
    @include component.base;
  }
}
`;
};
