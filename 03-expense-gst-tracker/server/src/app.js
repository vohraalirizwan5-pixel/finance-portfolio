import cors from 'cors';
import express from 'express';
import { authRoutes, requireAuth } from './auth.js';
import { CATEGORIES, GST_RATES, PAYMENT_MODES } from './gst.js';
import { expenseRoutes } from './routes/expenses.js';

// Kept separate from index.js so tests can create the app with a test database.
export function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/meta', (_req, res) => res.json({ categories: CATEGORIES, gstRates: GST_RATES, paymentModes: PAYMENT_MODES }));
  app.use('/api/auth', authRoutes(db));
  app.use('/api/expenses', requireAuth, expenseRoutes(db));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server' });
  });
  return app;
}
