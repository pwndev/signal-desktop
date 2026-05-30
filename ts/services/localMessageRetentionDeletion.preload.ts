import lodash from 'lodash';

import * as Errors from '../types/errors.std.ts';
import { createLogger } from '../logging/log.std.ts';
import { DataReader, DataWriter } from '../sql/Client.preload.ts';
import { clearTimeoutIfNecessary } from '../util/clearTimeoutIfNecessary.std.ts';
import { sleep } from '../util/sleep.std.ts';
import { SECOND, DurationInSeconds } from '../util/durations/index.std.ts';
import { MessageModel } from '../models/messages.preload.ts';
import { cleanupMessages } from '../util/cleanup.preload.ts';
import { drop } from '../util/drop.std.ts';
import { get as getLocalMessageRetentionTimer } from '../util/localMessageRetentionTimer.preload.ts';

const { debounce } = lodash;

const log = createLogger('localMessageRetentionDeletion');
const DELETE_BATCH_SIZE = 200;

class LocalMessageRetentionDeletionService {
  #timeout?: ReturnType<typeof setTimeout>;
  readonly #debouncedCheckMessages = debounce(this.#checkMessages, 1000);

  update() {
    drop(this.#debouncedCheckMessages());
  }

  async #destroyExpiredMessages() {
    try {
      const retentionWindow = DurationInSeconds.toMillis(
        getLocalMessageRetentionTimer()
      );
      const maxTimestamp = Date.now() - retentionWindow;

      while (true) {
        const messages =
          await DataReader.getLocalMessageRetentionMessagesNeedingDeletion(
            maxTimestamp,
            DELETE_BATCH_SIZE
          );
        if (!messages.length) {
          break;
        }

        const messageIds: Array<string> = [];
        const inMemoryMessages: Array<MessageModel> = [];

        messages.forEach(dbMessage => {
          const message = window.MessageCache.register(
            new MessageModel(dbMessage)
          );
          messageIds.push(message.id);
          inMemoryMessages.push(message);
        });

        await DataWriter.removeMessagesById(messageIds, {
          cleanupMessages,
        });

        inMemoryMessages.forEach(message => {
          log.info('Message removed by local retention', {
            sentAt: message.get('sent_at'),
          });
        });
      }
    } catch (error) {
      log.error(
        'destroyExpiredMessages: Error deleting local-retention-expired messages',
        Errors.toLogFormat(error)
      );
      log.info('destroyExpiredMessages: Waiting 30 seconds before trying again');
      await sleep(30 * SECOND);
    }

    this.update();
  }

  async #checkMessages() {
    const retentionWindow = DurationInSeconds.toMillis(
      getLocalMessageRetentionTimer()
    );
    const soonestExpiry =
      await DataReader.getNextLocalMessageRetentionTimestampToAgeOut(
        retentionWindow
      );
    if (!soonestExpiry) {
      return;
    }

    let wait = soonestExpiry - Date.now();
    if (wait < 0) {
      wait = 0;
    }
    if (wait > 2147483647) {
      wait = 2147483647;
    }

    clearTimeoutIfNecessary(this.#timeout);
    this.#timeout = setTimeout(this.#destroyExpiredMessages.bind(this), wait);
  }
}

export function initialize(): void {
  if (instance) {
    log.warn('Local Message Retention Deletion service is already initialized!');
    return;
  }
  instance = new LocalMessageRetentionDeletionService();
}

export function update(): void {
  if (!instance) {
    throw new Error(
      'Local Message Retention Deletion service not yet initialized!'
    );
  }
  instance.update();
}

let instance: LocalMessageRetentionDeletionService;
