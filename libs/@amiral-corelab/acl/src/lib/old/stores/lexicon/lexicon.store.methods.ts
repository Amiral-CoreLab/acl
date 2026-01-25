import { inject, Injectable } from '@angular/core';
import { LexiconStoreState } from './lexicon.store.state';
import type { TermDomainModel } from '../../structures/models/lexicon/term-domain.model';
import type { TermModel } from '../../structures/models/lexicon/term.model';
import { LocaleCode } from '../../primitives/locale-code';

@Injectable({
  providedIn: 'root',
})
export class LexiconStoreMethods {
  private readonly state = inject(LexiconStoreState);

  public readonly createDomain = async (): Promise<void> => {};
  public readonly updateDomain = async (): Promise<void> => {};
  public readonly deleteDomain = async (): Promise<void> => {};

  public readonly createTerm = async (): Promise<void> => {
    await Promise.resolve();

    const term: TermModel = { definitions: [], label: '', locale: LocaleCode(), name: '', tags: [] };

    this.state.terms.update((terms) => ({
      ...terms,
      [term.name]: term,
    }));
  };

  public readonly updateTerm = async (): Promise<void> => {
    await Promise.resolve();

    const term: TermModel = { definitions: [], label: '', locale: LocaleCode(), name: '', tags: [] };

    this.state.terms.update((terms) => ({
      ...terms,
      [term.name]: term,
    }));
  };

  public readonly deleteTerm = async (id: TermDomainModel['id']): Promise<void> => {
    await Promise.resolve();

    this.state.terms.update((terms) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...rest } = terms;
      return rest;
    });
  };
}
