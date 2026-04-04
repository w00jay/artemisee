import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchDsn } from '../data/dsn';
import { useMissionStore } from '../store';
import { Panel } from './Overlay';

export function DsnStatus() {
  const setDsnDishes = useMissionStore((s) => s.setDsnDishes);
  const dsnDishes = useMissionStore((s) => s.dsnDishes);

  const { data } = useQuery({
    queryKey: ['dsn'],
    queryFn: fetchDsn,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (data) setDsnDishes(data);
  }, [data, setDsnDishes]);

  // Filter for Artemis II related dishes
  const artemis = dsnDishes.filter(
    (d) => d.target.includes('EM2') || d.target.includes('ARTEMIS') || d.target.includes('Artemis'),
  );

  if (artemis.length === 0) return null;

  return (
    <Panel style={{ maxWidth: 200 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11, opacity: 0.7 }}>
        DSN
      </div>
      {artemis.map((d, i) => (
        <div key={i} style={{ fontSize: 12 }}>
          <span style={{ color: '#00ff88' }}>{d.name}</span>
          <span style={{ opacity: 0.6 }}> {d.station}</span>
        </div>
      ))}
    </Panel>
  );
}
