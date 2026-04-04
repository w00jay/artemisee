import type { ReactNode } from 'react';

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: 16,
};

export function Overlay({ children }: { children: ReactNode }) {
  return <div style={overlayStyle}>{children}</div>;
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(10, 10, 14, 0.72)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: 10,
  padding: '12px 16px',
  pointerEvents: 'auto',
  color: '#e4e4e7',
  fontSize: 13,
  lineHeight: 1.6,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow:
    'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 4px 24px rgba(0, 0, 0, 0.4)',
};

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return <div style={{ ...panelStyle, ...style }}>{children}</div>;
}
