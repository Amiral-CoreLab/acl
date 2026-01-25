import type { DocumentContributorModel } from './document-contributor.model';
import type { DocumentLicenseModel } from './document-license.model';

export interface DocumentModel {
  /** Type de document */
  /**
   * 'article' | 'book' | 'standard' | 'website' | 'internal' | 'thesis'
   */
  type: string;
  title: string;
  version?: string;
  license: DocumentLicenseModel;
  contributors?: DocumentContributorModel[];

  /** Date publication (ISO 8601: "YYYY-MM-DD") */
  publicationDate: Date;

  /** Journal/revue */
  journal?: string;

  /** ISSN journal */
  issn?: string;

  /** DOI (préféré pour articles) */
  doi?: string;

  /** URL stable */
  url?: string;

  /** Volume */
  volume?: string;

  /** Numéro */
  issue?: string;

  /** Pages */
  pages?: string;

  /** Éditeur */
  publisher?: string;

  /** ID interne */
  internalId?: string;

  /** Confiance/qualité (0.0-1.0) */
  confidence?: number;

  /** Mots-clés/indexation */
  keywords?: string[];
}
