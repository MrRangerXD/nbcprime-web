import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Loader2, Copy, CheckCheck, RefreshCw, Crown } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Loader } from '../components/ui';

const FALLBACK = [
  { id: '10d',  label: '10 Days',  inr: 30,  usd: 0.32 },
  { id: '30d',  label: '30 Days',  inr: 80,  usd: 0.84 },
  { id: 'life', label: 'Lifetime', inr: 435, usd: 4.57 },
];

const PERKS = [
  'Unlimited nukes & mass actions',
  'No command cooldowns',
  'Priority action queue',
  'Premium badge on your profile',
];

const COINS = [
  { id: 'LTC', label: 'Litecoin', ticker: 'LTC' },
  { id: 'SOL', label: 'Solana',   ticker: 'SOL' },
];

const qr = (data) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(data)}`;

export default function Premium() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState(FALLBACK);
  const [status, setStatus] = useState(null);
  const [coin, setCoin] = useState('LTC');
  const [intent, setIntent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(null);
  const [msg, setMsg] = useState(null);
  const [left, setLeft] = useState(0);
  const poll = useRef(null);

  const loadStatus = () =>
    user && api.get('/api/premium/status').then(setStatus).catch(() => {});

  useEffect(() => {
    api.get('/api/premium/plans').then((r) => r?.plans && setPlans(r.plans)).catch(() => {});
    loadStatus();
  }, [user]);

  useEffect(() => {
    clearInterval(poll.current);
    if (!intent) return;
    poll.current = setInterval(() => check(true), 15000);
    return () => clearInterval(poll.current);
  }, [intent]);

  useEffect(() => {
    if (!intent) return;
    const tick = () =>
      setLeft(Math.max(0, Math.floor((new Date(intent.expiresAt) - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [intent]);

  const start = async (planId) => {
    if (!user) return navigate('/login');
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.post('/api/premium/intent', { plan: planId, currency: coin });
      setIntent(r.intent);
      setLeft(Math.floor((new Date(r.intent.expiresAt) - Date.now()) / 1000));
    } catch (e) {
      setMsg({ ok: false, text: String(e.message).replace(/_/g, ' ') });
    } finally {
      setBusy(false);
    }
  };

  const check = async (silent) => {
    if (!intent) return;
    if (!silent) setChecking(true);
    try {
      const r = await api.post(`/api/premium/verify/${intent.id}`);
      if (r.status === 'approved') {
        setMsg({ ok: true, text: 'Payment confirmed. Premium activated.' });
        setIntent(null);
        loadStatus();
        refresh?.();
      } else if (r.status === 'expired') {
        setMsg({ ok: false, text: 'Payment window expired. Start again.' });
        setIntent(null);
      } else if (!silent) {
        setMsg({ ok: false, text: 'No matching transaction yet. Give it a minute.' });
      }
    } catch {
      if (!silent) setMsg({ ok: false, text: 'Could not reach the chain. Retry.' });
    } finally {
      setChecking(false);
    }
  };

  const changePlan = async () => {
    const id = intent?.id;
    setIntent(null);
    setMsg(null);
    if (id) await api.post(`/api/premium/cancel/${id}`).catch(() => {});
  };

  const copy = async (val, key) => {
    try { await navigator.clipboard.writeText(val); } catch { /* noop */ }
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Get Premium</h1>
          <p className="mt-1.5 text-sm text-muted">Unlimited nukes, no cooldowns, priority queue.</p>
        </div>
        {status?.premium ? (
          <Badge tone="green">
            <Crown size={12} className="mr-1.5" />
            {status.until ? `Until ${new Date(status.until).toLocaleDateString()}` : 'Lifetime'}
          </Badge>
        ) : (
          <Badge>Not subscribed</Badge>
        )}
      </div>

      {msg && (
        <div className={'rounded-xl border px-4 py-3 text-sm ' + (msg.ok
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-red-500/30 bg-red-500/10 text-red-300')}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {COINS.map((c) => (
          <button
            key={c.id}
            onClick={() => { setCoin(c.id); setIntent(null); }}
            className={'rounded-xl border px-4 py-2 text-sm transition ' + (coin === c.id
              ? 'border-accent/50 bg-accent/10 text-white'
              : 'border-edge text-muted hover:bg-white/5 hover:text-white')}
          >
            Pay with {c.label}
          </button>
        ))}
      </div>

      {!intent ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((p) => {
            const popular = p.id === '30d';
            return (
              <div
                key={p.id}
                className={'card relative p-5 ' + (popular ? 'border-accent/50 bg-accent/[0.06]' : '')}
              >
                {popular && (
                  <span className="absolute -top-2.5 left-5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    Most popular
                  </span>
                )}
                <div className="text-[11px] uppercase tracking-wider text-muted">{p.label}</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold">₹{p.inr}</span>
                  <span className="text-sm text-muted">/ ${Number(p.usd).toFixed(2)}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {PERKS.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-[13px] text-muted">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => start(p.id)}
                  disabled={busy}
                  className={'mt-5 w-full ' + (popular ? 'btn-primary' : 'btn-ghost')}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Choose {p.label.toLowerCase()}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card grid gap-5 p-5 sm:grid-cols-[200px_1fr]">
          <div className="rounded-xl bg-white p-2">
            <img src={qr(intent.uri)} alt="payment qr" className="h-full w-full" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{intent.label} — {intent.currency}</div>
              <div className="text-xs text-muted">{mm}:{ss} left</div>
            </div>

            <div className="mt-3 text-[11px] uppercase tracking-wider text-muted">Send exactly</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-lg">{intent.amount} {intent.currency}</span>
              <button onClick={() => copy(String(intent.amount), 'amt')} className="text-muted hover:text-white">
                {copied === 'amt' ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="mt-3 text-[11px] uppercase tracking-wider text-muted">To address</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="break-all font-mono text-xs text-white/80">{intent.address}</span>
              <button onClick={() => copy(intent.address, 'addr')} className="shrink-0 text-muted hover:text-white">
                {copied === 'addr' ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => check(false)} disabled={checking} className="btn-primary">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Verify payment
              </button>
              <button onClick={changePlan} className="btn-ghost">Change plan</button>
            </div>

            <p className="mt-3 text-xs text-muted">
              Auto-checking every 15s. Exact amount zaroor bhejo — usi se match hota hai.
            </p>
          </div>
        </div>
      )}

      <div className="card p-5 text-sm text-muted">
        <div className="font-display font-semibold text-white">How it works</div>
        <p className="mt-1">
          Plan choose karo, QR scan karo ya address copy karo, exact crypto amount bhejo.
          Chain confirm hone par premium automatically activate ho jata hai — admin ki zaroorat nahi.
        </p>
      </div>
    </div>
  );
}
