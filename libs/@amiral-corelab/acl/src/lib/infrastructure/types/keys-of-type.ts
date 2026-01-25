export type KeysOfType<Map, EventType> = { [K in keyof Map]: Map[K] extends EventType ? K : never }[keyof Map];
