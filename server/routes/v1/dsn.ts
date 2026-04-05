import { Router } from 'express';
import type { DsnContact } from '../../data/types';

export const dsnV1Router = Router();

dsnV1Router.get('/', async (_req, res) => {
  try {
    const response = await fetch('https://eyes.nasa.gov/dsn/data/dsn.xml');
    const xml = await response.text();
    const contacts = parseDsnXml(xml);

    const artemis = contacts.filter(
      (c) => c.target === 'EM2' || c.target.includes('ARTEMIS') || c.target.includes('Artemis'),
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

function parseDsnXml(xml: string): DsnContact[] {
  const contacts: DsnContact[] = [];
  let currentStation = '';

  // Stations and dishes are siblings in the XML, not nested.
  // Walk through all tags in order — a <station> sets the context
  // for all subsequent <dish> tags until the next <station>.
  const stationRegex = /<station\s+name="([^"]*)"[^>]*friendlyName="([^"]*)"[^>]*\/>/g;
  const dishRegex = /<dish\s+name="([^"]*)"[^>]*>([\s\S]*?)<\/dish>/g;

  // Build a map of station positions in the XML
  const stationPositions: { pos: number; name: string; friendly: string }[] = [];
  let match;
  while ((match = stationRegex.exec(xml)) !== null) {
    stationPositions.push({ pos: match.index, name: match[1], friendly: match[2] });
  }

  while ((match = dishRegex.exec(xml)) !== null) {
    const dishPos = match.index;
    const dishName = match[1];
    const dishBody = match[2];

    // Find which station this dish belongs to
    for (let i = stationPositions.length - 1; i >= 0; i--) {
      if (stationPositions[i].pos < dishPos) {
        currentStation = stationPositions[i].friendly;
        break;
      }
    }

    // Parse targets within this dish
    const targetRegex = /<target\s+name="([^"]*)"[^>]*uplegRange="([^"]*)"[^>]*downlegRange="([^"]*)"[^>]*rtlt="([^"]*)"[^>]*\/?>/g;
    let tgt;
    while ((tgt = targetRegex.exec(dishBody)) !== null) {
      const range = parseFloat(tgt[3]); // downlegRange in km
      if (tgt[1] === 'DSN' || tgt[1] === 'DSS') continue; // skip internal targets

      // Parse signal info
      const upSignals = dishBody.match(/<upSignal[^>]*spacecraft="([^"]*)"[^>]*frequency="([^"]*)"[^>]*\/?>/g);
      const downSignals = dishBody.match(/<downSignal[^>]*spacecraft="([^"]*)"[^>]*frequency="([^"]*)"[^>]*\/?>/g);

      let uplinkFreq = 0;
      let downlinkFreq = 0;
      if (upSignals) {
        const freqMatch = upSignals[0].match(/frequency="([^"]*)"/);
        if (freqMatch) uplinkFreq = parseFloat(freqMatch[1]);
      }
      if (downSignals) {
        const freqMatch = downSignals[0].match(/frequency="([^"]*)"/);
        if (freqMatch) downlinkFreq = parseFloat(freqMatch[1]);
      }

      contacts.push({
        antenna: dishName,
        station: currentStation,
        target: tgt[1],
        uplink_freq_mhz: uplinkFreq,
        downlink_freq_mhz: downlinkFreq,
        range_km: range,
      });
    }
  }

  return contacts;
}
