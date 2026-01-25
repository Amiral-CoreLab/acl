export interface DocumentLicenseModel {
  /** ID court/normalisé : 'ISC', 'CC-BY-4.0', 'MIT', 'proprietary', 'custom' */
  id: string;

  /** Nom lisible complet */
  name: string;

  /** URL vers le texte officiel (recommandé) */
  url?: string;

  /** Texte custom si licence non-standard */
  customText?: string;
}
