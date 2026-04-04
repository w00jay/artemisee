import { useMissionStore } from '../store';
import { Panel } from './Overlay';
import type { CameraPreset } from '../data/types';

const PRESETS: { key: CameraPreset; label: string }[] = [
  { key: 'solar-system', label: 'Overview' },
  { key: 'earth', label: 'Earth' },
  { key: 'moon', label: 'Moon' },
  { key: 'spacecraft', label: 'Orion' },
];

export function CameraButtons() {
  const cameraTarget = useMissionStore((s) => s.cameraTarget);
  const setCameraTarget = useMissionStore((s) => s.setCameraTarget);

  return (
    <Panel style={{ display: 'flex', gap: 6 }}>
      {PRESETS.map(({ key, label }) => (
        <button
          key={key}
          className={`btn ${cameraTarget === key ? 'btn-active' : ''}`}
          onClick={() => setCameraTarget(key)}
        >
          {label}
        </button>
      ))}
    </Panel>
  );
}
