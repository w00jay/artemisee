import express from 'express';
import cors from 'cors';
import { horizonsRouter } from './routes/horizons';
import { dsnRouter } from './routes/dsn';

const app = express();
app.use(cors());

app.use('/api/horizons', horizonsRouter);
app.use('/api/dsn', dsnRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 4001;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Artemisee API server on :${PORT}`);
});
