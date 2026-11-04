import { DEPOSIT, DEPOSIT_META } from '../../lib/constants.js';
import { Field, FieldLabel, DateInput } from '../ui/Field.jsx';
import Select from '../ui/Select.jsx';
import TurnaroundPicker from './TurnaroundPicker.jsx';

const depositOptions = Object.values(DEPOSIT).map((value) => ({ value, label: DEPOSIT_META[value].label }));

/**
 * Deposit status, deposit date and agreed turnaround. Used by the New
 * Project form and the project panel. Works with "YYYY-MM-DD" strings;
 * `onChange` receives only the fields that changed.
 */
export default function TimelineFields({ idPrefix, depositStatus, depositDate, turnaroundWeeks, onChange }) {
  const received = depositStatus === DEPOSIT.RECEIVED;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <Field id={`${idPrefix}-deposit`} label="Deposit">
          <Select
            id={`${idPrefix}-deposit`}
            label="Deposit status"
            value={depositStatus}
            onChange={(value) => onChange({ depositStatus: value })}
            options={depositOptions}
            leading={<span className={`size-2 rounded-full ${DEPOSIT_META[depositStatus].dot}`} />}
          />
        </Field>
        <Field id={`${idPrefix}-deposit-date`} label="Deposit received date">
          <DateInput
            id={`${idPrefix}-deposit-date`}
            value={received ? depositDate : ''}
            onChange={(e) => e.target.value && onChange({ depositDate: e.target.value })}
            disabled={!received}
            className="disabled:opacity-40"
          />
        </Field>
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={`${idPrefix}-turnaround`}>
          <span id={`${idPrefix}-turnaround-label`}>Agreed turnaround</span>
        </FieldLabel>
        <TurnaroundPicker
          id={`${idPrefix}-turnaround`}
          value={turnaroundWeeks}
          onChange={(weeks) => onChange({ turnaroundWeeks: weeks })}
        />
      </div>
    </div>
  );
}
