import { useState } from 'react';
import { Panel } from './Overlay';

const controls = [
  { input: 'Left drag', action: 'Rotate view' },
  { input: 'Right drag', action: 'Pan view' },
  { input: 'Scroll wheel', action: 'Zoom in / out' },
  { input: 'Middle drag', action: 'Dolly (smooth zoom)' },
  { input: 'Double click', action: 'Focus on point' },
  { input: 'Pinch (touch)', action: 'Zoom in / out' },
  { input: 'Two-finger drag', action: 'Pan view' },
];

function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="6" />
      <path d="M5.5 5.5a1.5 1.5 0 0 1 2.9.5c0 1-1.4 1-1.4 2" strokeLinecap="round" />
      <circle cx="7" cy="10.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HelpPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, pointerEvents: 'auto' }}>
      <button
        className="btn"
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <HelpIcon />
        {open ? 'Close' : 'Controls'}
      </button>

      {open && (
        <Panel style={{ minWidth: 220 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, color: '#7dd3fc', letterSpacing: '0.02em' }}>
            Camera Controls
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {controls.map(({ input, action }) => (
              <div key={input} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'rgba(228, 228, 231, 0.5)' }}>{input}</span>
                <span style={{ color: '#e4e4e7' }}>{action}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
