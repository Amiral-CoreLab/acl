import type { PersonModel } from '../contact/person.model';
import type { OrganizationAffiliationModel } from '../organization/organization-affiliation.model';

export interface DocumentContributorModel extends PersonModel {
  /**
   * 'author' | 'editor' | 'reviewer' | 'contributor'
   */
  role: string;
  affiliation?: OrganizationAffiliationModel;
}
