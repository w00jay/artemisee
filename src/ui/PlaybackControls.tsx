import { useMissionStore } from '../store';
import { getMission } from '../lib/missions';
import { Panel } from './Overlay';

const SPEEDS = [1, 10, 60, 600, 3600];
const SPEED_LABELS = ['1x', '10x', '1m/s', '10m/s', '1h/s'];

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <polygon points="2,0 12,6 2,12" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <rect x="1" y="0" width="3.5" height="12" rx="1" />
      <rect x="7.5" y="0" width="3.5" height="12" rx="1" />
    </svg>
  );
}

export function PlaybackControls() {
  const isPlaying = useMissionStore((s) => s.isPlaying);
  const playbackSpeed = useMissionStore((s) => s.playbackSpeed);
  const setPlaying = useMissionStore((s) => s.setPlaying);
  const setSpeed = useMissionStore((s) => s.setSpeed);
  const jumpToNow = useMissionStore((s) => s.jumpToNow);
  const setSimTime = useMissionStore((s) => s.setSimTime);
  const activeMission = useMissionStore((s) => s.activeMission);
  const mission = getMission(activeMission);
  const isCompleted = mission.status === 'completed';

  return (
    <Panel style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        className="btn"
        onClick={() => setPlaying(!isPlaying)}
        style={{ display: 'flex', alignItems: 'center', padding: '5px 10px' }}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      {SPEEDS.map((speed, i) => (
        <button
          key={speed}
          className={`btn ${playbackSpeed === speed ? 'btn-active' : ''}`}
          onClick={() => setSpeed(speed)}
        >
          {SPEED_LABELS[i]}
        </button>
      ))}

      {isCompleted ? (
        <button className="btn" onClick={() => setSimTime(mission.missionStart.getTime())}>
          RESTART
        </button>
      ) : (
        <button className="btn" onClick={jumpToNow}>
          NOW
        </button>
      )}
    </Panel>
  );
}
