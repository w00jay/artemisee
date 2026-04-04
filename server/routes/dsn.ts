import { Router } from 'express';

export const dsnRouter = Router();

dsnRouter.get('/', async (_req, res) => {
  try {
    const response = await fetch(
      'https://eyes.nasa.gov/dsn/data/dsn.xml',
    );
    const xml = await response.text();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(xml);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
});
