import type { TermModel } from './term.model';
import type { DocumentModel } from '../document/document.model';

export interface TermDefinitionModel {
  name: TermModel['name'];
  locale: TermModel['locale'];
  text: string;
  reference: DocumentModel;
}
