import { useEffect, useState } from 'react';
import { Gift, Plus, StopCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Badge, Empty } from '../../components/ui';
import { timeLeft } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

export default function Giveaways() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [form, setForm] = useState({ guildId: '', channelId: '', prize: '', minutes: 60, winners: 1 });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [tick, setTick] = useState(0);

  const load = () => api.get('/api/giveaways').then((d) => setRows(d.data)).catch(() => setRows([]));

  useEffect(() => {
    load();
    api.get('/api/guilds?limit=100').then((d) => setGuilds(d.data)).catch(() => {});
  }, []);

  // FIX: countdown khud update na ho raha tha
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setToast(null);
    try {
      await api.post('/api/giveaways', {
        ...form,
        minutes: Number(form.minutes),
        winners: Number(form.winners),
      });
      setToast({ ok: true, msg: 'Giveaway launched' });
      setForm({ ...form, prize: '' });
      load();
    } catch (err) {
      setToast({ ok: false, msg: err.message });
    } finally {
      setBusy(false);
    }
  };

  const end = async (g) => {
    // FIX: message_id bhejo, warna bot ko "giveaway not found" milta hai
    try {
      await api.post('/api/giveaways/' + g._id + '/end', { messageId: g.messageId || undefined });
      setToast({ ok: true, msg: 'Ending giveaway...' });
      setTimeout(load, 3000);
    } catch (e) {
      setToast({ ok: false, msg: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Giveaways</h1>
        <p className="mt-1.5 text-sm text-muted">Launch and end giveaways across any server.</p>
      </div>

      {toast && <div className={'card p-3 text-sm ' + (toast.ok ? 'text-emerald-300' : 'text-red-300')}>{toast.msg}</div>}

      {user?.isAdmin && (
        <Card>
          <h2 className="font-display font-semibold">New Giveaway</h2>
          <form onSubmit={create} className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="label">Server</label>
              <select className="input" required value={form.guildId} onChange={(e) => setForm({ ...form, guildId: e.target.value })}>
                <option value="">Select a server</option>
                {guilds.map((g) => <option key={g.guildId} value={g.guildId}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Channel ID (optional)</label>
              <input className="input" placeholder="defaults to first channel" value={form.channelId}
                     onChange={(e) => setForm({ ...form, channelId: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Prize</label>
              <input className="input" required placeholder="Discord Nitro 1 Month" value={form.prize}
                     onChange={(e) => setForm({ ...form, prize: e.target.value })} />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" min="1" className="input" value={form.minutes}
                     onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
            </div>
            <div>
              <label className="label">Winners</label>
              <input type="number" min="1" className="input" value={form.winners}
                     onChange={(e) => setForm({ ...form, winners: e.target.value })} />
            </div>
            <button disabled={busy} className="btn-primary md:col-span-2">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Launch Giveaway
            </button>
          </form>
        </Card>
      )}

      {rows === null ? <Loader /> : rows.length === 0 ? (
        <Empty title="No giveaways yet" sub="Create one above to get started." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((g) => (
            <Card key={g._id} className="card-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Gift size={16} className="text-accent" />
                  <h3 className="font-display font-semibold">{g.prize}</h3>
                </div>
                <Badge tone={g.status === 'active' ? 'green' : 'default'}>
                  {g.status === 'active' ? timeLeft(g.endsAt) : g.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted">
                {g.guildName || g.guildId} - {g.winnersCount} winner(s)
              </p>
              {g.status === 'active' && user?.isAdmin && (
                <button onClick={() => end(g)} className="btn-ghost mt-4 w-full">
                  <StopCircle size={15} /> End now
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
