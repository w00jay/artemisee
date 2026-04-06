import { Router } from 'express';
import { cacheGet, cacheSet } from '../../cache';

export const newsRouter = Router();

const SNAPI_BASE = 'https://api.spaceflightnewsapi.net/v4';
const CACHE_TTL = 15 * 60 * 1000; // 15 min

newsRouter.get('/', async (req, res) => {
  try {
    const search = (req.query.q as string) || 'artemis';
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const key = `news:${search}:${limit}`;

    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const url = `${SNAPI_BASE}/articles/?search=${encodeURIComponent(search)}&limit=${limit}&ordering=-published_at`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`SNAPI HTTP ${resp.status}`);
    const json = await resp.json();

    const articles = json.results.map((a: Record<string, unknown>) => ({
      title: a.title,
      summary: a.summary,
      url: a.url,
      image_url: a.image_url,
      source: a.news_site,
      published: a.published_at,
    }));

    const result = { articles, count: articles.length };
    cacheSet(key, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
