import { useQuery } from '@tanstack/react-query';
import { Panel } from './Overlay';

interface WeatherData {
  solar_wind: {
    plasma: { time: string; density: number | null; speed: number | null }[];
    magnetic_field: { time: string; bt: number | null; bz: number | null }[];
  };
  kp_index: { time: string; kp: number; level: string } | null;
  updated: string;
}

const KP_COLORS: Record<string, string> = {
  quiet: '#00ff88',
  unsettled: '#fbbf24',
  storm: '#f97316',
  strong_storm: '#ef4444',
  severe_storm: '#dc2626',
};

export function SpaceWeather() {
  const { data } = useQuery({
    queryKey: ['space-weather'],
    queryFn: async () => {
      const res = await fetch('/v1/weather');
      if (!res.ok) return null;
      return res.json() as Promise<WeatherData>;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  });

  if (!data) return null;

  const latestPlasma = data.solar_wind.plasma[data.solar_wind.plasma.length - 1];
  const latestMag = data.solar_wind.magnetic_field[data.solar_wind.magnetic_field.length - 1];
  const kp = data.kp_index;

  return (
    <Panel style={{ maxWidth: 200 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 11, opacity: 0.7 }}>
        SPACE WEATHER
      </div>

      {kp && (
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 11, opacity: 0.5 }}>Kp Index </span>
          <span style={{ color: KP_COLORS[kp.level] || '#e4e4e7', fontWeight: 600, fontSize: 14 }}>
            {kp.kp.toFixed(1)}
          </span>
          <span style={{ fontSize: 10, opacity: 0.4, marginLeft: 4 }}>{kp.level.replace('_', ' ')}</span>
        </div>
      )}

      {latestPlasma && (
        <div style={{ fontSize: 11 }}>
          <Row label="Solar Wind" value={latestPlasma.speed != null ? `${Math.round(latestPlasma.speed)} km/s` : '—'} />
          <Row label="Density" value={latestPlasma.density != null ? `${latestPlasma.density.toFixed(1)} p/cm³` : '—'} />
        </div>
      )}

      {latestMag && (
        <div style={{ fontSize: 11 }}>
          <Row label="Bt" value={latestMag.bt != null ? `${latestMag.bt.toFixed(1)} nT` : '—'} />
          <Row label="Bz" value={latestMag.bz != null ? `${latestMag.bz.toFixed(1)} nT` : '—'} />
        </div>
      )}
    </Panel>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
      <span style={{ opacity: 0.5 }}>{label}</span>
      <span style={{ fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}
