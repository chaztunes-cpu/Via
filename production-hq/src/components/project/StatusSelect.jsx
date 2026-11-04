import { STATUS_META, STATUS_ORDER } from '../../lib/constants.js';
import { StatusDot } from '../ui/StatusBadge.jsx';
import Select from '../ui/Select.jsx';

const options = STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label }));

export default function StatusSelect({ id, value, onChange, className }) {
  return (
    <Select
      id={id}
      label="Project status"
      value={value}
      onChange={onChange}
      options={options}
      leading={<StatusDot status={value} className="size-2" />}
      className={className}
    />
  );
}
