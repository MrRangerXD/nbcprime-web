import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, RefreshCw, Loader2, ShieldCheck, Clock, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Loader } from '../components/ui';
import PricingSection from '../components/PricingSection';
import { useCopy } from '../lib/clipboard';
import { timeLeft } from '../lib/format';

export default function Pricing() {
  const { user, login, refresh } = useAuth();
  const { copied, copy } = useCopy();

  const [plans, setPlans] = useState([]);
  const [currency, setCurrency] = useState('LTC');
  const [intent, setIntent] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [, tick] = useState(0);

  useEffect(() => {
    api.get('/api/premium/plans')
      .then((r) => setPlans(r.plans || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadStatus = useCallback(() => {
    if (!user) return;
    api.get('/api/premium/status')
      .then((r) => {
        setStatus(r);
        if (r.pending) setIntent(r.pending);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const verify = useCallback(async (silent = false) => {
    if (!intent) return;
    if (!silent) setBusy(true);
    try {
      const r = await api.post(`/api/premium/verify/${intent.id}`);
      if (r.status === 'approved') {
        setStatus((s) => ({ ...(s || {}), premium: true }));
        setIntent(null);
        refresh();
      } else if (r.status === 'expired') {
        setStatus((s) => ({ ...(s || {}), expired: true }));
      }
      setError('');
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setBusy(false);
    }
  }, [intent, refresh]);

  useEffect(() => {
    if (!intent || status?.premium) return;
    const id = setInterval(() => verify(true), 15000);
    return () => clearInterval(id);
  }, [intent, status?.premium, verify]);

  const start = async (planId) => {
    if (!user) return login();
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/api/premium/intent', { plan: planId, currency });
      setIntent(r.intent);
      if (r.settled?.length) loadStatus();
    } catch (e) {
      setError(e.status === 503 ? 'Live rate unavailable, try again in a moment.' : e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!intent) return;
    setBusy(true);
    try {
      await api.post(`/api/premium/cancel/${intent.id}`);
      setIntent(null);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const activePlan = plans.find((p) => p.id === intent?.plan);

  return (
    <>
      <PricingSection />

      <section id="checkout" className="mx-auto max-w-5xl px-5 pb-24">
        <div className="mb-10 text-center">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">Checkout</p>
          <h2 className="font-display text-3xl font-bold">Pay &amp; get unlocked</h2>
        </div>

        {loading ? <Loader /> : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="font-display text-lg font-bold">1. Pick a plan</h3>

              <div className="mt-4 space-y-2.5">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => start(p.id)}
                    disabled={busy || !user}
                    className={
                      'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition disabled:opacity-50 ' +
                      (intent?.plan === p.id ? 'border-white/40 bg-white/5' : 'border-edge hover:border-white/25')
                    }
                  >
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
                  {['LTC', 'SOL'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={
                        'rounded-lg border px-4 py-2 text-xs font-semibold transition ' +
                        (currency === c ? 'border-white bg-white text-black' : 'border-edge text-muted hover:text-white')
                      }
                    >
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
                  <div className="grid h-14 w-14 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                    <ShieldCheck size={24} className="text-emerald-300" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold">Premium active</h3>
                  <p className="mt-1 text-sm text-muted">
                    {status.until ? `Expires ${new Date(status.until).toLocaleDateString()}` : 'Lifetime access'}
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
                    <QRCodeSVG value={intent.uri} size={168} level="M" />
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <span className="label">Amount ({intent.currency})</span>
                      <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface/60 p-3">
                        <code className="mono flex-1 text-sm">{intent.amount}</code>
                        <button onClick={() => copy(intent.amount, 'amt')} className="text-muted hover:text-white">
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
                    Send the <b>exact</b> amount — the extra decimals are how the system identifies your payment.
                  </p>

                  <button onClick={() => verify()} disabled={busy} className="btn-primary mt-4 w-full">
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Verify payment
                  </button>
                  <button onClick={cancel} disabled={busy} className="btn-ghost mt-2 w-full">
                    <XCircle size={14} /> Cancel
                  </button>
                  <p className="mt-2 text-center text-[11px] text-dim">Auto-checking every 15s</p>
                </>
              )}
            </Card>
          </div>
        )}
      </section>
    </>
  );
}