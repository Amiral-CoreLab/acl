import type { PersonNameModel } from './person-name.model';

export interface PersonModel {
  names: PersonNameModel[];
  orcid?: string;
  url?: string;
}
