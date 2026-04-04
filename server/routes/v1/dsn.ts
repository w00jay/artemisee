import { Router } from 'express';
import type { DsnContact } from '../../data/types';

export const dsnV1Router = Router();

const STATION_MAP: Record<string, string> = {
  gdscc: 'Goldstone',
  cdscc: 'Canberra',
  mdscc: 'Madrid',
};

dsnV1Router.get('/', async (_req, res) => {
  try {
    const response = await fetch('https://eyes.nasa.gov/dsn/data/dsn.xml');
    const xml = await response.text();

    // Simple XML parsing without a library
    const contacts: DsnContact[] = [];
    const stationRegex = /<station[^>]*name="([^"]*)"[^>]*>([\s\S]*?)<\/station>/g;
    const dishRegex = /<dish[^>]*name="([^"]*)"[^>]*>([\s\S]*?)<\/dish>/g;
    const targetRegex = /<target[^>]*name="([^"]*)"[^>]*(?:uplegRange="([^"]*)")?[^>]*(?:downlegRange="([^"]*)")?[^>]*(?:rtlt="([^"]*)")?[^>]*/g;

    let stationMatch;
    while ((stationMatch = stationRegex.exec(xml)) !== null) {
      const stationName = stationMatch[1];
      const stationBody = stationMatch[2];
      const friendlyStation = STATION_MAP[stationName.toLowerCase()] ?? stationName;

      let dishMatch;
      dishRegex.lastIndex = 0;
      while ((dishMatch = dishRegex.exec(stationBody)) !== null) {
        const dishName = dishMatch[1];
        const dishBody = dishMatch[2];

        let targetMatch;
        targetRegex.lastIndex = 0;
        while ((targetMatch = targetRegex.exec(dishBody)) !== null) {
          contacts.push({
            antenna: dishName,
            station: friendlyStation,
            target: targetMatch[1] || '',
            uplink_freq_mhz: parseFloat(targetMatch[2] || '0'),
            downlink_freq_mhz: parseFloat(targetMatch[3] || '0'),
            range_km: parseFloat(targetMatch[4] || '0'),
          });
        }
      }
    }

    // Filter for Artemis II
    const artemis = contacts.filter(
      (c) => c.target.includes('EM2') || c.target.includes('ARTEMIS') || c.target.includes('Artemis'),
    );

    res.json({
      contacts: artemis,
      all_contacts_count: contacts.length,
      timestamp_utc: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
});
