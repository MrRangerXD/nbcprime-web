import { useEffect, useState } from 'react';
import { Copy, Check, RefreshCw, Loader2, Crown, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../lib/api';
import { Card, Badge, Loader } from '../../components/ui';
import { timeLeft } from '../../lib/format';

export default function Premium() {
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [currency, setCurrency] = useState('LTC');
  const [intent, setIntent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const r = await api.get('/api/premium/status');
      setData(r);
      if (r.pending) setIntent(r.pending);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    api.get('/api/premium/plans').then((r) => setPlans(r.plans)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!intent || data?.premium) return;
    const id = setInterval(() => verify(true), 15000);
    return () => clearInterval(id);
  }, [intent, data?.premium]);

  const start = async (planId) => {
    setBusy(true); setError('');
    try {
      const r = await api.post('/api/premium/intent', { plan: planId, currency });
      setIntent(r.intent);
      if (r.settled?.length) load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const verify = async (silent = false) => {
    if (!silent) setBusy(true);
    try {
      const r = await api.post(`/api/premium/verify/${intent.id}`);
      if (r.status === 'approved') { setIntent(null); load(); }
    } catch (e) { if (!silent) setError(e.message); } finally { if (!silent) setBusy(false); }
  };

  const copy = (v, k) => navigator.clipboard?.writeText(v).then(() => { setCopied(k); setTimeout(() => setCopied(''), 1200); });

  if (!data) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown size={22} />
        <h1 className="font-display text-2xl font-bold">Get Premium</h1>
        {data.premium && <Badge tone="solid">ACTIVE</Badge>}
      </div>

      {data.premium && (
        <Card className="border-emerald-500/25">
          <p className="font-display text-lg font-bold">You are premium 🎉</p>
          <p className="mt-1 text-sm text-muted">
            {data.until ? `Expires ${new Date(data.until).toLocaleString()}` : 'Lifetime access'} · source: <code className="mono">{data.source}</code>
          </p>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-display font-bold">Plans</h2>
          <div className="mt-4 space-y-2.5">
            {plans.map((p) => (
              <button key={p.id} onClick={() => start(p.id)} disabled={busy}
                className={'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ' +
                  (intent?.plan === p.id ? 'border-white/40 bg-white/5' : 'border-edge hover:border-white/25')}>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className="text-xs text-dim">{p.days ? `${p.days} days` : 'Lifetime'}</p>
                </div>
                <p className="mono text-sm font-bold">₹{p.inr}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            {['LTC', 'SOL'].map((c) => (
              <button key={c} onClick={() => setCurrency(c)}
                className={'rounded-lg border px-4 py-2 text-xs font-semibold ' +
                  (currency === c ? 'border-white bg-white text-black' : 'border-edge text-muted')}>{c}</button>
            ))}
          </div>
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
        </Card>

        <Card>
          {!intent ? (
            <p className="py-12 text-center text-sm text-dim">Pick a plan to generate a payment address.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold">Send {intent.amount} {intent.currency}</h2>
                <Badge tone="amber"><Clock size={11} className="mr-1" />{timeLeft(intent.expiresAt)}</Badge>
              </div>
              <div className="mt-4 flex justify-center rounded-xl border border-edge bg-white p-3">
                <QRCodeSVG value={intent.uri} size={150} />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-edge bg-surface/60 p-3">
                  <code className="mono flex-1 text-sm">{intent.amount}</code>
                  <button onClick={() => copy(String(intent.amount), 'a')}>{copied === 'a' ? <Check size={14} /> : <Copy size={14} />}</button>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-edge bg-surface/60 p-3">
                  <code className="mono flex-1 truncate text-xs">{intent.address}</code>
                  <button onClick={() => copy(intent.address, 'b')}>{copied === 'b' ? <Check size={14} /> : <Copy size={14} />}</button>
                </div>
              </div>
              <button onClick={() => verify()} disabled={busy} className="btn-primary mt-4 w-full">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Verify payment
              </button>
            </>
          )}
        </Card>
      </div>

      {!!data.history?.length && (
        <Card>
          <h2 className="font-display font-bold">History</h2>
          <div className="mt-4 divide-y divide-edge">
            {data.history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="mono text-xs text-dim">{h.currency}</span>
                <span className="mono">{h.amountCrypto}</span>
                <Badge tone={h.status === 'approved' ? 'green' : h.status === 'pending' ? 'amber' : 'default'} className="ml-auto">{h.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
