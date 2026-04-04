import type { VercelRequest, VercelResponse } from '@vercel/node';

const EDGE_TTL = 3600; // 1 hour

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const params = new URLSearchParams(req.query as Record<string, string>);
    const jplUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;

    const jpl = await fetch(jplUrl);
    const data = await jpl.json();

    if (data.error) {
      return res.status(502).json({ error: data.error });
    }

    res.setHeader('Cache-Control', `s-maxage=${EDGE_TTL}, stale-while-revalidate`);
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
