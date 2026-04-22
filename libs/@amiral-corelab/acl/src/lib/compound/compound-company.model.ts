import type { CompoundModel } from './compound.model';
import type { CompanyModel } from '../company/company.model';
import type { UuidV7 } from '../primitives/uuid-v7';

export interface CompoundCompanyModel {
  id: UuidV7;

  compound: CompoundModel;
  company: CompanyModel;
}
