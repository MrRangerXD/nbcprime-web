import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, RefreshCw, Loader2, ShieldCheck, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Section, Badge, Card } from '../components/ui';
import PricingSection from '../components/PricingSection';
import { timeLeft } from '../lib/format';

const CURRENCIES = ['LTC', 'SOL'];

export default function Pricing() {
  const { user, login } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currency, setCurrency] = useState('LTC');
  const [intent, setIntent] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    api.get('/api/premium/plans').then((r) => setPlans(r.plans)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/api/premium/status')
      .then((r) => { if (r.pending) setIntent(r.pending); setStatus(r); })
      .catch(() => {});
  }, [user]);

  // countdown
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // auto poll
  useEffect(() => {
    if (!intent || status?.premium) return;
    const id = setInterval(() => { verify(intent.id, true); }, 15000);
    return () => clearInterval(id);
  }, [intent, status?.premium]);

  const start = async (planId) => {
    if (!user) return login();
    setBusy(true); setError('');
    try {
      const r = await api.post('/api/premium/intent', { plan: planId, currency });
      setIntent(r.intent);
      if (r.settled?.length) { await api.get('/api/premium/status').then(setStatus); }
    } catch (e) {
      setError(e.status === 503 ? 'Live rate unavailable, try again in a moment.' : e.message);
    } finally { setBusy(false); }
  };

  const verify = async (id, silent = false) => {
    if (!silent) setBusy(true);
    try {
      const r = await api.post(`/api/premium/verify/${id || intent.id}`);
      if (r.status === 'approved') {
        setStatus((s) => ({ ...s, premium: true }));
        setIntent(null);
      }
      setError('');
    } catch (e) {
      if (!silent) setError(e.message);
    } finally { if (!silent) setBusy(false); }
  };

  const copy = (val, key) => navigator.clipboard?.writeText(val).then(() => {
    setCopied(key); setTimeout(() => setCopied(''), 1200);
  });

  const activePlan = plans.find((p) => p.id === intent?.plan);

  return (
    <>
      <Section eyebrow="Pricing" title="Simple pricing. Crypto only."
        sub="No subscriptions to cancel, no card needed. Send LTC or SOL and premium unlocks automatically after 1 confirmation.">
        <PricingSection />
      </Section>

      <Section eyebrow="Checkout" title="Pay & get unlocked" className="pt-0">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card>
            <h3 className="font-display text-lg font-bold">1. Pick a plan</h3>
            <div className="mt-4 space-y-2.5">
              {plans.map((p) => (
                <button key={p.id} onClick={() => start(p.id)} disabled={busy || !user}
                  className={'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ' +
                    (intent?.plan === p.id ? 'border-white/40 bg-white/5' : 'border-edge hover:border-white/25')}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-xs text-dim">{p.days ? `${p.days} days access` : 'Never expires'}</p>
                  </div>
                  <div className="text-right">
                    <p className="mono text-sm font-bold">₹{p.inr}</p>
                    <p className="text-[11px] text-dim">≈ ${p.usd}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5">
              <span className="label">Currency</span>
              <div className="flex gap-2">
                {CURRENCIES.map((c) => (
                  <button key={c} onClick={() => setCurrency(c)}
                    className={'rounded-lg border px-4 py-2 text-xs font-semibold transition ' +
                      (currency === c ? 'border-white bg-white text-black' : 'border-edge text-muted hover:text-white')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {!user && (
              <div className="mt-5 rounded-xl border border-edge bg-surface/50 p-4 text-sm text-muted">
                Sign in with Discord first to create a payment intent.
                <button onClick={login} className="btn-primary mt-3 w-full">Sign in with Discord</button>
              </div>
            )}

            {error && <p className="mt-4 text-xs text-red-300">{error}</p>}
          </Card>

          <Card className="flex flex-col">
            {status?.premium ? (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                  <ShieldCheck size={24} className="text-emerald-300" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">Premium active</h3>
                <p className="mt-1 text-sm text-muted">
                  {status.until ? `Renews/expires ${new Date(status.until).toLocaleDateString()}` : 'Lifetime access'}
                </p>
                <Link to="/dashboard" className="btn-ghost mt-5">Open dashboard</Link>
              </div>
            ) : !intent ? (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <p className="font-display text-base">No active payment</p>
                <p className="mt-1 text-sm text-dim">Pick a plan to generate an address.</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold">2. Send exactly</h3>
                    <p className="text-xs text-dim">{activePlan?.label} · {intent.currency}</p>
                  </div>
                  <Badge tone="amber"><Clock size={11} className="mr-1" />{timeLeft(intent.expiresAt)}</Badge>
                </div>

                <div className="mt-4 flex justify-center rounded-xl border border-edge bg-white p-3">
                  <QRCodeSVG value={intent.uri} size={168} level="M" bgColor="#ffffff" fgColor="#000000" />
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <span className="label">Amount ({intent.currency})</span>
                    <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface/60 p-3">
                      <code className="mono flex-1 text-sm">{intent.amount}</code>
                      <button onClick={() => copy(String(intent.amount), 'amt')} className="text-muted hover:text-white">
                        {copied === 'amt' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="label">Address</span>
                    <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface/60 p-3">
                      <code className="mono flex-1 truncate text-xs">{intent.address}</code>
                      <button onClick={() => copy(intent.address, 'addr')} className="text-muted hover:text-white">
                        {copied === 'addr' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-dim">
                  Send the exact amount — the extra decimals are how the system identifies your payment.
                  Wrong amount = payment stuck.
                </p>

                <button onClick={() => verify()} disabled={busy} className="btn-primary mt-4 w-full">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Verify payment
                </button>
                <p className="mt-2 text-center text-[11px] text-dim">Auto-checking every 15s</p>
              </>
            )}
          </Card>
        </div>
      </Section>
    </>
  );
}
