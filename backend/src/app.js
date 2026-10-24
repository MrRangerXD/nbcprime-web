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

const NO_AUTH_PREFIXES = ['/api/public', '/api/ingest'];
const NO_AUTH_EXACT = ['/api/health', '/api/diag'];

// FIX: sirf ek origin nahi — localhost + vercel previews bhi
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === env.FRONTEND_URL) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
};

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  // FIX: Vercel rewrite se aane wale /api/index ko normalise karo
  app.use((req, _res, next) => {
    if (req.url.startsWith('/api/index')) req.url = req.url.slice('/api/index'.length) || '/';
    next();
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Ingest-Key'],
  }));
  app.use(express.json({ limit: '1mb' }));
  const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
  app.use('/api', (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const raw = req.get('origin') || req.get('referer');
    if (!raw) return next();
    let origin;
    try { origin = new URL(raw).origin; } catch { return next(); }
    if (isAllowedOrigin(origin)) return next();
    return res.status(403).json({ ok: false, error: 'csrf_origin_mismatch' });
  });

  // FIX: body-less POST pe req.body undefined hota hai -> destructuring crash (giveaways/admin)
  app.use((req, _res, next) => {
    if (req.body === undefined) req.body = {};
    next();
  });

  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use('/api', rateLimit({ windowMs: 60000, max: 300, standardHeaders: true }));
  app.use('/api/auth', rateLimit({ windowMs: 60000, max: 60 }));

  app.use((req, res, next) => {
    if (NO_AUTH_EXACT.includes(req.path)) return next();
    if (NO_AUTH_PREFIXES.some((p) => req.path.startsWith(p))) return next();
    return attachUser(req, res, next);
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/guilds', guildRoutes);
  app.use('/api/leaderboard', lbRoutes);
  app.use('/api/giveaways', giveawayRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ingest', ingestRoutes);
  app.use('/api/premium', premiumRoutes);

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
