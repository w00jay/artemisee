import { useMissionStore } from '../store';
import { Panel } from './Overlay';

const SPEEDS = [1, 10, 60, 600, 3600];
const SPEED_LABELS = ['1x', '10x', '1m/s', '10m/s', '1h/s'];

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  borderRadius: 4,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 12,
};

const activeBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: 'rgba(0, 204, 255, 0.3)',
  borderColor: '#00ccff',
};

export function PlaybackControls() {
  const isPlaying = useMissionStore((s) => s.isPlaying);
  const playbackSpeed = useMissionStore((s) => s.playbackSpeed);
  const setPlaying = useMissionStore((s) => s.setPlaying);
  const setSpeed = useMissionStore((s) => s.setSpeed);
  const jumpToNow = useMissionStore((s) => s.jumpToNow);

  return (
    <Panel style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        style={btnStyle}
        onClick={() => setPlaying(!isPlaying)}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {SPEEDS.map((speed, i) => (
        <button
          key={speed}
          style={playbackSpeed === speed ? activeBtnStyle : btnStyle}
          onClick={() => setSpeed(speed)}
        >
          {SPEED_LABELS[i]}
        </button>
      ))}

      <button style={btnStyle} onClick={jumpToNow}>
        NOW
      </button>
    </Panel>
  );
}
