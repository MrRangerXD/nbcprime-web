import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { attachUser } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import meRoutes from './routes/me.js';
import guildRoutes from './routes/guilds.js';
import lbRoutes from './routes/leaderboard.js';
import giveawayRoutes from './routes/giveaways.js';
import adminRoutes from './routes/admin.js';
import ingestRoutes from './routes/ingest.js';
import premiumRoutes from './routes/premium.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  // ---- global middleware FIRST ----
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.FRONTEND_URL.replace(/\/$/, ''), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use('/api', rateLimit({ windowMs: 60000, max: 300, standardHeaders: true }));
  app.use('/api/auth', rateLimit({ windowMs: 60000, max: 60 }));

  app.use(attachUser);

  // ---- routes AFTER ----
  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/guilds', guildRoutes);
  app.use('/api/leaderboard', lbRoutes);
  app.use('/api/giveaways', giveawayRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ingest', ingestRoutes);
  app.use('/api/premium', premiumRoutes); // <- was mounted before middleware

  app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use((_req, res) => res.status(404).json({ ok: false, error: 'not_found' }));

  app.use((err, _req, res, _next) => {
    console.error('[error]', err);
    res.status(err.status || 500).json({
      ok: false,
      error: env.NODE_ENV === 'production' ? 'internal_error' : err.message,
    });
  });

  return app;
}
