import type { MapParams } from "../types";

interface SliderDef {
  key: keyof MapParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

const sliders: SliderDef[] = [
  { key: "wanderSpeed", label: "wander speed", min: 0.0, max: 2.0, step: 0.01 },
  { key: "wanderAmount", label: "wander amount", min: 0, max: 90, step: 1 },
  { key: "noiseFrequency", label: "noise frequency", min: 0.1, max: 5.0, step: 0.1 },
  { key: "noiseOctaves", label: "noise octaves", min: 1, max: 6, step: 1 },
  { key: "noiseLacunarity", label: "lacunarity", min: 1.0, max: 4.0, step: 0.1 },
  { key: "noisePersistence", label: "persistence", min: 0.1, max: 0.9, step: 0.05 },
  { key: "lonLatRatio", label: "lon/lat ratio", min: 0.2, max: 5.0, step: 0.1 },
  // { key: "graticuleStep", label: "graticule step", min: 5, max: 60, step: 5 },
  // { key: "lineWidth", label: "line width", min: 0.25, max: 3.0, step: 0.25 },
];

interface Props {
  params: MapParams;
  onChange: (key: keyof MapParams, value: number) => void;
  freeDrift: boolean;
  onToggleFreeDrift: () => void;
}

export default function SliderPanel({ params, onChange, freeDrift, onToggleFreeDrift }: Props) {
  return (
    <div className="slider-panel">
      <div className="slider-grid">
        {sliders.map((s) => (
          <div key={s.key} className="slider-row">
            <label className="slider-label">{s.label}</label>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={params[s.key]}
              onChange={(e) => onChange(s.key, parseFloat(e.target.value))}
            />
            <span className="slider-value">
              {s.step >= 1
                ? params[s.key]
                : params[s.key].toFixed(s.step < 0.1 ? 2 : 1)}
            </span>
          </div>
        ))}
      </div>
      <div className="toggle-row">
        <label className="slider-label">free drift</label>
        <button
          className={`slide-toggle${freeDrift ? " on" : ""}`}
          onClick={onToggleFreeDrift}
          role="switch"
          aria-checked={freeDrift}
        >
          <span className="slide-toggle-knob" />
        </button>
      </div>
    </div>
  );
}
