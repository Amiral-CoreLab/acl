import type { LocaleCode } from '../../../primitives/locale-code';
import type { TermDefinitionModel } from './term-definition.model';

export interface TermModel {
  locale: LocaleCode;
  name: string;
  label: string;
  definitions: TermDefinitionModel[];
  synonyms?: TermModel[];
  tags: string[];
}
