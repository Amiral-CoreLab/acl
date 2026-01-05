import { normalizeLineEndingsUtil } from './normalize-line-endings.util';

export const getTextLinesUtil = (text: string): string[] => normalizeLineEndingsUtil(text).split('\n');
