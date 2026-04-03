interface Props {
  paused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onRandomize: () => void;
}

export default function Controls({
  paused,
  onTogglePause,
  onReset,
  onRandomize,
}: Props) {
  return (
    <div className="controls">
      <div className="controls-row">
        <button className="control-btn" onClick={onTogglePause}>
          {paused ? "play" : "pause"}
        </button>
        <button className="control-btn" onClick={onReset}>
          reset
        </button>
        <button className="control-btn" onClick={onRandomize}>
          randomize
        </button>
      </div>
    </div>
  );
}
