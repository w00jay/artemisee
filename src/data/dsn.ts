import type { DsnDish } from './types';

const STATION_MAP: Record<string, string> = {
  gdscc: 'Goldstone',
  cdscc: 'Canberra',
  mdscc: 'Madrid',
};

/**
 * Parse DSN Now XML response into DsnDish objects.
 */
export function parseDsnXml(xml: string): DsnDish[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const dishes: DsnDish[] = [];

  const stationEls = doc.querySelectorAll('station');
  for (const station of stationEls) {
    const stationName = station.getAttribute('name') ?? '';
    const friendlyStation = STATION_MAP[stationName.toLowerCase()] ?? stationName;

    const dishEls = station.querySelectorAll('dish');
    for (const dish of dishEls) {
      const name = dish.getAttribute('name') ?? '';

      const targets = dish.querySelectorAll('target');
      for (const target of targets) {
        const targetName = target.getAttribute('name') ?? '';
        const upSignal = parseFloat(target.getAttribute('uplegRange') ?? '0');
        const downSignal = parseFloat(target.getAttribute('downlegRange') ?? '0');
        const range = parseFloat(target.getAttribute('rtlt') ?? '0');

        dishes.push({
          name,
          station: friendlyStation,
          target: targetName,
          upSignal,
          downSignal,
          range,
        });
      }
    }
  }

  return dishes;
}

/**
 * Fetch DSN status from our API proxy.
 */
export async function fetchDsn(): Promise<DsnDish[]> {
  const res = await fetch('/api/dsn');
  if (!res.ok) throw new Error(`DSN proxy error: ${res.status}`);
  const xml = await res.text();
  return parseDsnXml(xml);
}
