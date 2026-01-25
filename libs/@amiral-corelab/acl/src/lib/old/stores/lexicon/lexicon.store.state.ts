import { Injectable, signal } from '@angular/core';
import type { TermDomainModel } from '../../structures/models/lexicon/term-domain.model';
import type { TermModel } from '../../structures/models/lexicon/term.model';

@Injectable({
  providedIn: 'root',
})
export class LexiconStoreState {
  public readonly domains = signal<Record<TermDomainModel['id'], TermDomainModel>>({});
  public readonly terms = signal<Record<TermModel['name'], TermModel>>({});
}
