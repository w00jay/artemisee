import { useMissionStore } from '../store';
import { MISSIONS, getMission } from '../lib/missions';
import { Panel } from './Overlay';

export function MissionSelector() {
  const activeMission = useMissionStore((s) => s.activeMission);
  const setActiveMission = useMissionStore((s) => s.setActiveMission);
  const setSimTime = useMissionStore((s) => s.setSimTime);
  const mission = getMission(activeMission);

  const missionList = Object.values(MISSIONS);

  return (
    <Panel style={{ maxWidth: 220 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 11, opacity: 0.7 }}>
        MISSION
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {missionList.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              if (m.id === activeMission) return;
              setActiveMission(m.id);
              // Jump to mission start for completed missions, now for active
              setSimTime(m.status === 'completed' ? m.missionStart.getTime() : Date.now());
            }}
            style={{
              background: m.id === activeMission ? 'rgba(125, 211, 252, 0.2)' : 'rgba(255,255,255,0.06)',
              border: m.id === activeMission ? '1px solid rgba(125, 211, 252, 0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '4px 10px',
              color: m.id === activeMission ? '#7dd3fc' : '#a1a1aa',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {m.name}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>
        {mission.spacecraft} — {mission.description}
      </div>
      {mission.status === 'completed' && (
        <div style={{ fontSize: 10, color: '#fbbf24', marginTop: 4 }}>
          REPLAY MODE
        </div>
      )}
    </Panel>
  );
}
