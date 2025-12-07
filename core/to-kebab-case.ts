export const toKebabCase = (value: string): string =>
  value
    .trim()
    .replace(/(?<a>[a-z])(?<b>[A-Z])/gu, '$1-$2')
    .replace(/(?<a>[a-zA-Z])(?<b>[0-9])/gu, '$1-$2')
    .replace(/(?<a>[0-9])(?<b>[a-zA-Z])/gu, '$1-$2')
    .replace(/[_\s/]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .toLowerCase();
