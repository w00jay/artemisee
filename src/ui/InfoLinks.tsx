import { Panel } from './Overlay';

const links = [
  { label: 'NASA Artemis II', url: 'https://www.nasa.gov/mission/artemis-ii/' },
  { label: 'JPL Horizons API', url: 'https://ssd.jpl.nasa.gov/horizons/' },
  { label: 'NASA AROW Tracker', url: 'https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/' },
  { label: 'DSN Now', url: 'https://eyes.nasa.gov/apps/dsn-now/' },
];

const linkStyle: React.CSSProperties = {
  color: '#7dd3fc',
  textDecoration: 'none',
  fontSize: 11,
  transition: 'color 0.15s',
};

export function InfoLinks() {
  return (
    <Panel style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '8px 14px' }}>
      {links.map(({ label, url }) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#bae6fd')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#7dd3fc')}
        >
          {label}
        </a>
      ))}
    </Panel>
  );
}
