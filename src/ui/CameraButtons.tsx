import { useMissionStore } from '../store';
import { Panel } from './Overlay';
import type { CameraPreset } from '../data/types';

const PRESETS: { key: CameraPreset; label: string }[] = [
  { key: 'solar-system', label: 'Overview' },
  { key: 'earth', label: 'Earth' },
  { key: 'moon', label: 'Moon' },
  { key: 'spacecraft', label: 'Orion' },
];

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

export function CameraButtons() {
  const cameraTarget = useMissionStore((s) => s.cameraTarget);
  const setCameraTarget = useMissionStore((s) => s.setCameraTarget);

  return (
    <Panel style={{ display: 'flex', gap: 6 }}>
      {PRESETS.map(({ key, label }) => (
        <button
          key={key}
          style={cameraTarget === key ? activeBtnStyle : btnStyle}
          onClick={() => setCameraTarget(key)}
        >
          {label}
        </button>
      ))}
    </Panel>
  );
}
