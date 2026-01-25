import type { KeysOfType } from '@amiral-corelab/acl';

export type WindowEventsKeysType =
  | KeysOfType<GlobalEventHandlersEventMap, FocusEvent>
  | KeysOfType<GlobalEventHandlersEventMap, KeyboardEvent>
  | KeysOfType<GlobalEventHandlersEventMap, PointerEvent>;
