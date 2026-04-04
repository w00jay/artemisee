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
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(8px)',
  borderRadius: 8,
  padding: '12px 16px',
  pointerEvents: 'auto',
  color: '#fff',
  fontSize: 13,
  lineHeight: 1.5,
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
