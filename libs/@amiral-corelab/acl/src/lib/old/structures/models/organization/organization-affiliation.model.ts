import type { ContactModel } from '../contact/contact.model';

export interface OrganizationAffiliationModel {
  organization: string; // TODO
  contact: ContactModel;
}
