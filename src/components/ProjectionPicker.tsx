import { projectionGroups } from "../data/projections";

interface Props {
  value: string;
  onChange: (name: string) => void;
}

export default function ProjectionPicker({ value, onChange }: Props) {
  return (
    <select
      className="projection-picker"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {projectionGroups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.projections.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
