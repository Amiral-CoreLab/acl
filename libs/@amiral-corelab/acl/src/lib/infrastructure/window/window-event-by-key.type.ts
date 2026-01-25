import type { WindowEventsKeysType } from './window-events-keys.type';

export type WindowEventByKeyType = {
  [Key in WindowEventsKeysType]: GlobalEventHandlersEventMap[Key];
};
