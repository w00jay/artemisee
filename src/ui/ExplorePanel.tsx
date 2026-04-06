import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Panel } from './Overlay';

type Tab = 'apod' | 'launches';

export function ExplorePanel() {
  const [tab, setTab] = useState<Tab>('apod');

  return (
    <Panel style={{ maxWidth: 280 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <TabButton active={tab === 'apod'} onClick={() => setTab('apod')}>APOD</TabButton>
        <TabButton active={tab === 'launches'} onClick={() => setTab('launches')}>LAUNCHES</TabButton>
      </div>
      {tab === 'apod' && <ApodContent />}
      {tab === 'launches' && <LaunchesContent />}
    </Panel>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(125, 211, 252, 0.15)' : 'transparent',
        border: 'none',
        color: active ? '#7dd3fc' : '#71717a',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        padding: '2px 8px',
        borderRadius: 4,
      }}
    >
      {children}
    </button>
  );
}

function ApodContent() {
  const { data } = useQuery({
    queryKey: ['apod'],
    queryFn: async () => {
      const res = await fetch('/v1/apod');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  if (!data) return <div style={{ fontSize: 11, opacity: 0.4 }}>Loading...</div>;

  return (
    <div>
      {data.media_type === 'image' && (
        <img
          src={data.url}
          alt={data.title}
          style={{ width: '100%', borderRadius: 6, marginBottom: 6 }}
        />
      )}
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{data.title}</div>
      <div style={{ fontSize: 10, opacity: 0.5, lineHeight: 1.4, maxHeight: 60, overflow: 'hidden' }}>
        {data.explanation?.slice(0, 200)}...
      </div>
      {data.copyright && (
        <div style={{ fontSize: 9, opacity: 0.3, marginTop: 4 }}>{data.copyright}</div>
      )}
    </div>
  );
}

function LaunchesContent() {
  const { data } = useQuery({
    queryKey: ['launches'],
    queryFn: async () => {
      const res = await fetch('/v1/launches?limit=5');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  if (!data?.launches) return <div style={{ fontSize: 11, opacity: 0.4 }}>Loading...</div>;

  return (
    <div>
      {data.launches.map((l: { name: string; net: string; status: string }, i: number) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: '#e4e4e7' }}>{l.name}</div>
          <div style={{ fontSize: 10, opacity: 0.4 }}>
            {l.net ? new Date(l.net).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
            {l.status ? ` — ${l.status}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
