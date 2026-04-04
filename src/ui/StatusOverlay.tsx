import { Panel } from './Overlay';

const wrapperStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'auto',
  textAlign: 'center',
};

export function LoadingOverlay() {
  return (
    <div style={wrapperStyle}>
      <Panel style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 32px' }}>
        <div style={{
          width: 24,
          height: 24,
          border: '2px solid rgba(125, 211, 252, 0.2)',
          borderTopColor: '#7dd3fc',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: 13, color: 'rgba(228, 228, 231, 0.6)' }}>
          Loading trajectory from JPL Horizons...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Panel>
    </div>
  );
}

export function ErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={wrapperStyle}>
      <Panel style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 32px', maxWidth: 360 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <circle cx="12" cy="16" r="0.5" fill="#f87171" />
        </svg>
        <div style={{ fontSize: 13, color: '#f87171' }}>
          Failed to load trajectory
        </div>
        <div style={{ fontSize: 11, color: 'rgba(228, 228, 231, 0.5)', lineHeight: 1.5 }}>
          {message}
        </div>
        <button className="btn" onClick={onRetry} style={{ marginTop: 4 }}>
          Retry
        </button>
      </Panel>
    </div>
  );
}
