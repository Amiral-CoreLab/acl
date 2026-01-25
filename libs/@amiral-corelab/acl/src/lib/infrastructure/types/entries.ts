import type { Entry, IterableSource } from '@amiral-corelab/acl';

export type Entries<K, V> = ReadonlyMap<K, V> | IterableSource<Entry<K, V>>;
