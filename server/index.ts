import express from 'express';
import cors from 'cors';
import { horizonsRouter } from './routes/horizons';
import { dsnRouter } from './routes/dsn';
import { positionRouter } from './routes/v1/position';
import { trajectoryRouter } from './routes/v1/trajectory';
import { eventsRouter } from './routes/v1/events';
import { observeRouter } from './routes/v1/observe';
import { dsnV1Router } from './routes/v1/dsn';
import { getCacheInfo } from './data/trajectory-cache';

const app = express();
app.use(cors());

// Legacy proxy routes (used by the frontend)
app.use('/api/horizons', horizonsRouter);
app.use('/api/dsn', dsnRouter);

// v1 REST API
app.use('/v1/position', positionRouter);
app.use('/v1/trajectory', trajectoryRouter);
app.use('/v1/events', eventsRouter);
app.use('/v1/observe', observeRouter);
app.use('/v1/dsn', dsnV1Router);

app.get('/v1/health', (_req, res) => {
  const cache = getCacheInfo();
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    horizons_cache: cache,
  });
});

// Keep legacy health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 4001;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Artemisee API server on :${PORT}`);
  console.log(`  Legacy:  /api/horizons, /api/dsn, /api/health`);
  console.log(`  REST v1: /v1/position, /v1/trajectory, /v1/events, /v1/observe, /v1/dsn, /v1/health`);
});
