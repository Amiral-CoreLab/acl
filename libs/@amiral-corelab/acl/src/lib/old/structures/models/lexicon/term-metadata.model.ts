import type { TermModel } from './term.model';

/**
 * @computed
 */
export interface TermMetadataModel {
  readonly name: TermModel['name'];
  readonly locales: TermModel['locale'][];
  readonly tags: TermModel['tags'];
}
