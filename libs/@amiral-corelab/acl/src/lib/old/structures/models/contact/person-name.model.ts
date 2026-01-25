import type { LocaleCode } from '../../../primitives/locale-code';
import type { PersonNameComponentModel } from './person-name-component.model';

export interface PersonNameModel {
  locale: LocaleCode;
  components: PersonNameComponentModel[];
}
