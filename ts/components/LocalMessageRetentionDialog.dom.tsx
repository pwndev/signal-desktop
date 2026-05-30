import { useState, type JSX } from 'react';
import { Select } from './Select.dom.tsx';
import type { LocalizerType } from '../types/Util.std.ts';
import { DurationInSeconds } from '../util/durations/index.std.ts';
import { AxoAlertDialog } from '../axo/AxoAlertDialog.dom.tsx';
import {
  DEFAULT_LOCAL_MESSAGE_RETENTION_TIMER,
  MAX_LOCAL_MESSAGE_RETENTION_TIMER,
  MIN_LOCAL_MESSAGE_RETENTION_TIMER,
} from '../util/localMessageRetentionTimer.preload.ts';

const CSS_MODULE = 'module-disappearing-time-dialog';

export type PropsType = Readonly<{
  i18n: LocalizerType;
  initialValue?: DurationInSeconds;
  onSubmit: (value: DurationInSeconds) => void;
  onClose: () => void;
}>;

const UNITS = ['seconds', 'minutes', 'hours', 'days'] as const;
type Unit = (typeof UNITS)[number];

const UNIT_TO_SEC = new Map<Unit, number>([
  ['seconds', 1],
  ['minutes', 60],
  ['hours', 60 * 60],
  ['days', 24 * 60 * 60],
]);

const RANGES = new Map<Unit, [number, number]>([
  ['seconds', [1, 60]],
  ['minutes', [1, 60]],
  ['hours', [1, 24]],
  ['days', [1, 4]],
]);

export function LocalMessageRetentionDialog(props: PropsType): JSX.Element {
  const {
    i18n,
    initialValue = DEFAULT_LOCAL_MESSAGE_RETENTION_TIMER,
    onSubmit,
    onClose,
  } = props;

  let initialUnit: Unit = 'seconds';
  let initialUnitValue = 1;
  for (const unit of UNITS) {
    const sec = UNIT_TO_SEC.get(unit) || 1;
    if (initialValue < sec) {
      break;
    }

    initialUnit = unit;
    initialUnitValue = Math.floor(initialValue / sec);
  }

  const [unitValue, setUnitValue] = useState(initialUnitValue);
  const [unit, setUnit] = useState<Unit>(initialUnit);

  const [rangeMin, rangeMax] = RANGES.get(unit) ?? [1, 2];
  const values: Array<number> = [];
  for (let i = rangeMin; i < rangeMax; i += 1) {
    values.push(i);
  }

  return (
    <AxoAlertDialog.Root open onOpenChange={onClose}>
      <AxoAlertDialog.Content escape="cancel-is-noop">
        <AxoAlertDialog.Body>
          <AxoAlertDialog.Title>
            {i18n('icu:LocalMessageRetentionDialog__title')}
          </AxoAlertDialog.Title>
          <AxoAlertDialog.Description>
            {i18n('icu:LocalMessageRetentionDialog__body')}
          </AxoAlertDialog.Description>

          <section className={`${CSS_MODULE}__time-boxes`}>
            <Select
              ariaLabel={i18n('icu:LocalMessageRetentionDialog__label--value')}
              moduleClassName={`${CSS_MODULE}__time-boxes__value`}
              value={unitValue}
              onChange={newValue => setUnitValue(parseInt(newValue, 10))}
              options={values.map(value => ({ value, text: value.toString() }))}
            />
            <Select
              ariaLabel={i18n('icu:LocalMessageRetentionDialog__label--units')}
              moduleClassName={`${CSS_MODULE}__time-boxes__units`}
              value={unit}
              onChange={newUnit => {
                setUnit(newUnit as Unit);

                const ranges = RANGES.get(newUnit as Unit);
                if (!ranges) {
                  return;
                }

                const [min, max] = ranges;
                setUnitValue(Math.max(min, Math.min(max - 1, unitValue)));
              }}
              options={UNITS.map(unitName => ({
                value: unitName,
                text: {
                  seconds: i18n('icu:DisappearingTimeDialog__seconds'),
                  minutes: i18n('icu:DisappearingTimeDialog__minutes'),
                  hours: i18n('icu:DisappearingTimeDialog__hours'),
                  days: i18n('icu:DisappearingTimeDialog__days'),
                }[unitName],
              }))}
            />
          </section>
        </AxoAlertDialog.Body>
        <AxoAlertDialog.Footer>
          <AxoAlertDialog.Cancel />
          <AxoAlertDialog.Action
            variant="primary"
            onClick={() => {
              const seconds = unitValue * (UNIT_TO_SEC.get(unit) ?? 1);
              const clamped = DurationInSeconds.fromSeconds(
                Math.max(
                  MIN_LOCAL_MESSAGE_RETENTION_TIMER,
                  Math.min(MAX_LOCAL_MESSAGE_RETENTION_TIMER, seconds)
                )
              );
              onSubmit(clamped);
            }}
          >
            {i18n('icu:LocalMessageRetentionDialog__set')}
          </AxoAlertDialog.Action>
        </AxoAlertDialog.Footer>
      </AxoAlertDialog.Content>
    </AxoAlertDialog.Root>
  );
}
