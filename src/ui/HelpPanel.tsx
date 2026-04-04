import { useState } from 'react';
import { Panel } from './Overlay';

const controls = [
  { input: 'Left drag', action: 'Rotate view' },
  { input: 'Right drag', action: 'Pan view' },
  { input: 'Scroll wheel', action: 'Zoom in / out' },
  { input: 'Middle drag', action: 'Dolly (zoom smooth)' },
  { input: 'Double click', action: 'Focus on point' },
  { input: 'Pinch (touch)', action: 'Zoom in / out' },
  { input: 'Two-finger drag', action: 'Pan view' },
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

export function HelpPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      <button style={btnStyle} onClick={() => setOpen(!open)}>
        {open ? 'Close help' : '? Controls'}
      </button>

      {open && (
        <Panel style={{ minWidth: 200 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>
            Camera Controls
          </div>
          <table style={{ fontSize: 11, borderSpacing: '8px 2px', margin: '-2px -8px' }}>
            <tbody>
              {controls.map(({ input, action }) => (
                <tr key={input}>
                  <td style={{ color: '#00ccff', whiteSpace: 'nowrap' }}>{input}</td>
                  <td style={{ opacity: 0.8 }}>{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
