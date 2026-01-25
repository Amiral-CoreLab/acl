import { inject, Injectable } from '@angular/core';
import { LexiconStoreState } from './lexicon.store.state';
import { LexiconStoreMethods } from './lexicon.store.methods';

@Injectable({
  providedIn: 'root',
})
export class LexiconStore {
  private readonly state = inject(LexiconStoreState);

  public readonly methods = inject(LexiconStoreMethods);

  public readonly domains = this.state.domains.asReadonly();
  public readonly terms = this.state.terms.asReadonly();
}
