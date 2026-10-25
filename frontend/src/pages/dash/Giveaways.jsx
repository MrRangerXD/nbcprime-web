import { useEffect, useState } from 'react';
import { Gift, Plus, XCircle, Trophy, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Empty, Badge } from '../../components/ui';
import { timeLeft, timeAgo } from '../../lib/format';

export default function Giveaways() {
  const [rows, setRows] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ guildId: '', prize: '', minutes: 60, winners: 1 });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/giveaways').then((d) => setRows(Array.isArray(d?.data) ? d.data : [])).catch(() => {}),
      api.get('/api/me/guilds').then((d) => setGuilds(Array.isArray(d?.data) ? d.data : [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.guildId || !form.prize) { setError('Server and prize are required.'); return; }
    setBusy(true); setError('');
    try {
      await api.post('/api/giveaways', {
        guildId: form.guildId,
        prize: form.prize,
        minutes: Number(form.minutes),
        winners: Number(form.winners),
      });
      setForm({ ...form, prize: '' });
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const end = async (id) => {
    setBusy(true);
    try { await api.post(`/api/giveaways/${id}/end`, {}); load(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const cancel = async (id) => {
    setBusy(true);
    try { await api.delete(`/api/giveaways/${id}`); load(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const active = rows.filter((r) => r.status === 'active');
  const past = rows.filter((r) => r.status !== 'active');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gift size={22} />
          <div>
            <h1 className="font-display text-3xl font-bold">Giveaways</h1>
            <p className="mt-1 text-sm text-muted">Launch and end giveaways remotely.</p>
          </div>
        </div>
        <button onClick={load} className="btn-ghost"><RefreshCw size={14} /> Refresh</button>
      </div>

      <Card>
        <h2 className="font-display font-semibold">New giveaway</h2>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1.4fr_0.7fr_0.7fr_auto]">
          <select className="input" value={form.guildId} onChange={(e) => setForm({ ...form, guildId: e.target.value })}>
            <option value="">Select server...</option>
            {guilds.map((g) => <option key={g.guildId} value={g.guildId}>{g.name}</option>)}
          </select>
          <input className="input" placeholder="Prize" value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} />
          <input className="input" type="number" min={1} placeholder="Mins" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
          <input className="input" type="number" min={1} placeholder="Winners" value={form.winners} onChange={(e) => setForm({ ...form, winners: e.target.value })} />
          <button className="btn-primary" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create
          </button>
        </form>
        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
      </Card>

      {loading ? <Loader /> : (
        <>
          <div>
            <h2 className="mb-3 font-display font-semibold">Active ({active.length})</h2>
            {active.length === 0 ? (
              <Empty title="No active giveaways" />
            ) : (
              <div className="space-y-2">
                {active.map((g) => (
                  <Card key={g.id} className="flex flex-wrap items-center gap-4">
                    <Trophy size={16} className="text-amber-300" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{g.prize}</p>
                      <p className="text-[11px] text-dim">
                        {g.guildName || g.guildId} · {g.winnersCount} winner(s) · ends in {timeLeft(g.endsAt)}
                      </p>
                    </div>
                    <button onClick={() => end(g.id)} disabled={busy} className="btn-primary text-xs">End now</button>
                    <button onClick={() => cancel(g.id)} disabled={busy} className="btn-ghost text-xs"><XCircle size={13} /></button>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div>
              <h2 className="mb-3 font-display font-semibold">Past ({past.length})</h2>
              <div className="space-y-2">
                {past.map((g) => (
                  <Card key={g.id} className="flex items-center gap-4 opacity-70">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{g.prize}</p>
                      <p className="text-[11px] text-dim">{timeAgo(g.createdAt)}</p>
                    </div>
                    <Badge tone={g.status === 'ended' ? 'green' : 'default'}>{g.status}</Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}