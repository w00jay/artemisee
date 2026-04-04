import { Router } from 'express';
import { getEvents } from '../../data/events';

export const eventsRouter = Router();

eventsRouter.get('/', (req, res) => {
  try {
    const filter = (req.query.filter as string) || 'upcoming';
    const limit = parseInt(req.query.limit as string) || 5;
    const fromParam = (req.query.from as string) || 'now';
    const direction = (req.query.direction as string) || filter;

    const referenceEpoch = fromParam === 'now' ? Date.now() : new Date(fromParam).getTime();

    if (isNaN(referenceEpoch)) {
      return res.status(400).json({ error: 'Invalid "from" parameter' });
    }

    const validFilters = ['upcoming', 'past', 'all', 'burns', 'milestones'];
    const effectiveFilter = validFilters.includes(direction) ? direction : filter;

    const events = getEvents(
      effectiveFilter as 'upcoming' | 'past' | 'all' | 'burns' | 'milestones',
      referenceEpoch,
      limit,
    );

    res.json({
      events: events.map((e) => ({
        name: e.name,
        met: e.met,
        utc: e.utc,
        category: e.category,
        countdown_seconds: Math.round(e.countdown_seconds),
        status: e.status,
      })),
      reference_utc: new Date(referenceEpoch).toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
