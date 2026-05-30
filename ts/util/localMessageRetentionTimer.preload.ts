import { DurationInSeconds } from './durations/index.std.ts';
import type { ItemsStateType } from '../state/ducks/items.preload.ts';
import { itemStorage } from '../textsecure/Storage.preload.ts';

const ITEM_NAME = 'localMessageRetentionTimer';

export const MIN_LOCAL_MESSAGE_RETENTION_TIMER = DurationInSeconds.fromSeconds(1);
export const MAX_LOCAL_MESSAGE_RETENTION_TIMER =
  DurationInSeconds.fromDays(3);
export const DEFAULT_LOCAL_MESSAGE_RETENTION_TIMER =
  DurationInSeconds.fromHours(8);
export const LOCAL_MESSAGE_RETENTION_PRESETS: ReadonlyArray<DurationInSeconds> = [
  DurationInSeconds.fromDays(3),
  DurationInSeconds.fromDays(1),
  DurationInSeconds.fromHours(8),
  DurationInSeconds.fromHours(1),
  DurationInSeconds.fromMinutes(5),
  DurationInSeconds.fromSeconds(30),
  DurationInSeconds.fromSeconds(1),
];
export const LOCAL_MESSAGE_RETENTION_PRESETS_SET: ReadonlySet<DurationInSeconds> =
  new Set(LOCAL_MESSAGE_RETENTION_PRESETS);

export function normalizeLocalMessageRetentionTimer(
  value: DurationInSeconds | number | undefined
): DurationInSeconds {
  const parsedValue = Number(value ?? DEFAULT_LOCAL_MESSAGE_RETENTION_TIMER);
  const numericValue = Number.isFinite(parsedValue)
    ? DurationInSeconds.fromSeconds(Math.floor(parsedValue))
    : DEFAULT_LOCAL_MESSAGE_RETENTION_TIMER;

  return DurationInSeconds.fromSeconds(
    Math.max(
      MIN_LOCAL_MESSAGE_RETENTION_TIMER,
      Math.min(MAX_LOCAL_MESSAGE_RETENTION_TIMER, numericValue)
    )
  );
}

export function get(): DurationInSeconds {
  return normalizeLocalMessageRetentionTimer(itemStorage.get(ITEM_NAME));
}

export function getForRedux(items: ItemsStateType): DurationInSeconds {
  return normalizeLocalMessageRetentionTimer(
    items[ITEM_NAME] as DurationInSeconds | number | undefined
  );
}

export function set(newValue: DurationInSeconds | undefined): Promise<void> {
  return itemStorage.put(ITEM_NAME, normalizeLocalMessageRetentionTimer(newValue));
}
