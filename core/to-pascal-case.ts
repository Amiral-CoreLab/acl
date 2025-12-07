import { capitalize } from './capitalize';

export const toPascalCase = (value: string): string =>
  value
    .trim()
    .replace(/(?<a>[a-z])(?<b>[A-Z])/gu, '$1 $2')
    .replace(/[_\- ]+/gu, ' ')
    .split(' ')
    .map(capitalize)
    .join('');
