export interface PersonNameComponentModel {
  type: 'prefix' | 'given' | 'middle' | 'family' | 'suffix' | 'infix' | 'generation' | 'nickname';
  value: string;
}
