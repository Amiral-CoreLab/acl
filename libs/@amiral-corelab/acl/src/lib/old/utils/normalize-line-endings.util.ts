export const normalizeLineEndingsUtil = (value: string): string =>
  value.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
