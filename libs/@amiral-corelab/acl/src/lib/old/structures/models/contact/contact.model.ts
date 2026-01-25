import type { PostalAddressModel } from './postal-address.model';

export interface ContactModel {
  email?: string;
  phone?: string;
  postal?: PostalAddressModel;
}
