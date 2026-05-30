import { assert } from 'chai';

import { DurationInSeconds } from '../../util/durations/index.std.ts';
import {
  DEFAULT_LOCAL_MESSAGE_RETENTION_TIMER,
  LOCAL_MESSAGE_RETENTION_PRESETS,
  MAX_LOCAL_MESSAGE_RETENTION_TIMER,
  MIN_LOCAL_MESSAGE_RETENTION_TIMER,
  normalizeLocalMessageRetentionTimer,
} from '../../util/localMessageRetentionTimer.preload.ts';

describe('localMessageRetentionTimer', () => {
  describe('LOCAL_MESSAGE_RETENTION_PRESETS', () => {
    it('includes the default value', () => {
      assert.include(
        LOCAL_MESSAGE_RETENTION_PRESETS,
        DEFAULT_LOCAL_MESSAGE_RETENTION_TIMER
      );
    });
  });

  describe('normalizeLocalMessageRetentionTimer', () => {
    it('defaults to 8 hours when unset', () => {
      assert.strictEqual(
        normalizeLocalMessageRetentionTimer(undefined),
        DEFAULT_LOCAL_MESSAGE_RETENTION_TIMER
      );
    });

    it('clamps to min and max bounds', () => {
      assert.strictEqual(
        normalizeLocalMessageRetentionTimer(DurationInSeconds.fromSeconds(0)),
        MIN_LOCAL_MESSAGE_RETENTION_TIMER
      );
      assert.strictEqual(
        normalizeLocalMessageRetentionTimer(DurationInSeconds.fromDays(7)),
        MAX_LOCAL_MESSAGE_RETENTION_TIMER
      );
    });

    it('rounds down fractional values', () => {
      assert.strictEqual(
        normalizeLocalMessageRetentionTimer(1.9),
        DurationInSeconds.fromSeconds(1)
      );
    });
  });
});
