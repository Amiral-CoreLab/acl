import type { CompoundModel } from './compound.model';
import type { DocumentModel } from '../document/document.model';

export interface CompoundDocumentModel {
  compound: CompoundModel;
  document: DocumentModel;
}
