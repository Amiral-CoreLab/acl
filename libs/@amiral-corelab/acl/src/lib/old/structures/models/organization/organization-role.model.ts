import type { OrganizationAffiliationModel } from './organization-affiliation.model';

export interface OrganizationRoleModel extends OrganizationAffiliationModel {
  department?: string; // TODO
  jobTitle: string; // TODO
}
