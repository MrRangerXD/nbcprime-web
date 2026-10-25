import { useCallback, useEffect, useState } from 'react';
import {
  Users, Server, Gift, Activity, FileText, Radio, HeartPulse,
  Crown, Shield, Ban, Search, Loader2, Trash2, Plus, Eye, EyeOff,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Empty, Badge, Avatar, Stat } from '../../components/ui';
import { nf, timeAgo } from '../../lib/format';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'giveaways', label: 'Giveaways', icon: Gift },
  { id: 'logs', label: 'Logs', icon: Shield },
  { id: 'broadcast', label: 'Broadcast', icon: Radio },
  { id: 'health', label: 'Health', icon: HeartPulse },
];

export default function Admin() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted">Global controls. Only visible to admins.</p>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={'flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ' +
              (tab === t.id ? 'border-white bg-white text-black' : 'border-edge text-muted hover:text-white')}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'users' && <UsersTab />}
      {tab === 'posts' && <PostsTab />}
      {tab === 'giveaways' && <GiveawaysTab />}
      {tab === 'logs' && <LogsTab />}
      {tab === 'broadcast' && <BroadcastTab />}
      {tab === 'health' && <HealthTab />}
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/api/admin/overview').then((d) => setData(d?.data || null)).catch(() => setData(null));
  }, []);

  if (!data) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={nf(data.users)} icon={Users} />
        <Stat label="Servers" value={nf(data.guilds)} icon={Server} />
        <Stat label="Commands 24h" value={nf(data.commandsToday)} icon={Activity} />
        <Stat label="Active giveaways" value={nf(data.giveaways)} icon={Gift} />
      </div>

      <Card>
        <div className="flex items-center gap-2">
          <HeartPulse size={16} className={data.bot?.online ? 'text-emerald-300' : 'text-red-300'} />
          <h2 className="font-display font-semibold">Bot</h2>
          <Badge className="ml-auto" tone={data.bot?.online ? 'green' : 'red'}>
            {data.bot?.online ? 'ONLINE' : 'OFFLINE'}
          </Badge>
        </div>
        {data.bot?.online && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><p className="text-xs text-muted">Guilds</p><p className="mono font-bold">{nf(data.bot.guild_count)}</p></div>
            <div><p className="text-xs text-muted">Reach</p><p className="mono font-bold">{nf(data.bot.member_reach)}</p></div>
            <div><p className="text-xs text-muted">Latency</p><p className="mono font-bold">{data.bot.latency_ms}ms</p></div>
            <div><p className="text-xs text-muted">Uptime</p><p className="mono font-bold">{Math.floor((data.bot.uptime_seconds || 0) / 3600)}h</p></div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-display font-semibold">Recent audit</h2>
        <div className="mt-4 divide-y divide-edge">
          {(data.recentAudit || []).map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
              <code className="mono text-xs">{a.action}</code>
              <span className="truncate text-[11px] text-dim">{a.actorName} → {a.target}</span>
              <span className="ml-auto shrink-0 text-[11px] text-dim">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
          {(data.recentAudit || []).length === 0 && <p className="py-3 text-sm text-muted">Nothing yet.</p>}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Users ---------------- */
function UsersTab() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/api/admin/users?limit=50${query ? `&q=${encodeURIComponent(query)}` : ''}`)
      .then((d) => setRows(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, path, body) => {
    setBusy(id + path);
    try { await api.post(`/api/admin/users/${id}/${path}`, body); load(); }
    catch { /* ignore */ } finally { setBusy(''); }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
        <input className="input pl-10" placeholder="Search username or ID..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading ? <Loader /> : (
        <Card className="p-0">
          <div className="divide-y divide-edge">
            {rows.map((u) => (
              <div key={u.discordId} className="flex flex-wrap items-center gap-3 p-4">
                <Avatar src={u.avatar} alt={u.username} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.globalName || u.username}</p>
                  <p className="mono text-[11px] text-dim">{u.discordId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {u.isPremium && <Badge tone="green">PREMIUM</Badge>}
                  {u.isAdmin && <Badge tone="amber">ADMIN</Badge>}
                  {u.isBanned && <Badge tone="red">BANNED</Badge>}
                  <span className="text-[11px] text-dim">{nf(u.totalCommands)} cmds</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => act(u.discordId, 'premium', { value: !u.isPremium })}
                    disabled={!!busy} title="Toggle premium" className="btn-ghost px-2 py-1.5">
                    <Crown size={13} className={u.isPremium ? 'text-emerald-300' : ''} />
                  </button>
                  <button onClick={() => act(u.discordId, 'admin', { value: !u.isAdmin })}
                    disabled={!!busy} title="Toggle admin" className="btn-ghost px-2 py-1.5">
                    <Shield size={13} className={u.isAdmin ? 'text-amber-300' : ''} />
                  </button>
                  <button onClick={() => act(u.discordId, 'ban', { value: !u.isBanned, reason: 'Admin action' })}
                    disabled={!!busy} title="Ban" className="btn-ghost px-2 py-1.5">
                    <Ban size={13} className={u.isBanned ? 'text-red-300' : ''} />
                  </button>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="p-6 text-center text-sm text-muted">No users.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Posts ---------------- */
function PostsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ type: 'blog', title: '', excerpt: '', content: '', published: false });

  const load = () => {
    setLoading(true);
    api.get('/api/admin/posts').then((d) => setRows(Array.isArray(d?.data) ? d.data : [])).catch(() => setRows([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    setBusy(true);
    try { await api.post('/api/admin/posts', form); setForm({ ...form, title: '', excerpt: '', content: '' }); load(); }
    catch { /* ignore */ } finally { setBusy(false); }
  };

  const toggle = async (p) => {
    try { await api.patch(`/api/admin/posts/${p.id}`, { published: !p.published }); load(); } catch { /* ignore */ }
  };

  const remove = async (id) => {
    try { await api.delete(`/api/admin/posts/${id}`); load(); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="font-display font-semibold">New post</h2>
        <form onSubmit={create} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="blog">Blog</option>
              <option value="news">News</option>
            </select>
            <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <input className="input" placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          <textarea className="input min-h-[140px] font-mono text-xs" placeholder="Markdown content..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Publish immediately
            </label>
            <button className="btn-primary ml-auto" disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create
            </button>
          </div>
        </form>
      </Card>

      {loading ? <Loader /> : (
        <Card className="p-0">
          <div className="divide-y divide-edge">
            {rows.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                <Badge tone={p.type === 'news' ? 'solid' : 'default'}>{p.type.toUpperCase()}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-[11px] text-dim">/{p.slug} · {p.views} views</p>
                </div>
                <Badge tone={p.published ? 'green' : 'amber'}>{p.published ? 'LIVE' : 'DRAFT'}</Badge>
                <button onClick={() => toggle(p)} className="btn-ghost px-2 py-1.5">
                  {p.published ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button onClick={() => remove(p.id)} className="btn-ghost px-2 py-1.5"><Trash2 size={13} /></button>
              </div>
            ))}
            {rows.length === 0 && <p className="p-6 text-center text-sm text-muted">No posts yet.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Giveaways ---------------- */
function GiveawaysTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/giveaways').then((d) => setRows(Array.isArray(d?.data) ? d.data : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!rows.length) return <Empty title="No giveaways" />;

  return (
    <Card className="p-0">
      <div className="divide-y divide-edge">
        {rows.map((g) => (
          <div key={g.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{g.prize}</p>
              <p className="text-[11px] text-dim">{g.guildName || g.guildId} · {timeAgo(g.createdAt)}</p>
            </div>
            <Badge tone={g.status === 'active' ? 'green' : 'default'}>{g.status}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- Logs ---------------- */
function LogsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/logs').then((d) => setRows(Array.isArray(d?.data) ? d.data : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <Card className="p-0">
      <div className="divide-y divide-edge">
        {rows.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-3 p-3.5 text-sm">
            <code className="mono text-xs text-white/80">{l.action}</code>
            <span className="truncate text-[11px] text-dim">{l.actorName || '—'} → {l.target || '—'}</span>
            <span className="ml-auto shrink-0 text-[11px] text-dim">{timeAgo(l.createdAt)}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="p-6 text-center text-sm text-muted">No logs.</p>}
      </div>
    </Card>
  );
}

/* ---------------- Broadcast ---------------- */
function BroadcastTab() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');

  const send = async () => {
    if (!message.trim()) return;
    setBusy(true); setDone('');
    try {
      const r = await api.post('/api/admin/broadcast', { message });
      setDone(`Queued. Job: ${r.jobId}`);
      setMessage('');
    } catch (e) { setDone(e.message); } finally { setBusy(false); }
  };

  return (
    <Card className="max-w-2xl">
      <h2 className="font-display font-semibold">DM broadcast</h2>
      <p className="mt-1 text-xs text-muted">Sends a DM to every member of every server. Slow — be patient.</p>
      <textarea className="input mt-4 min-h-[130px]" placeholder="Message..." value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={send} disabled={busy} className="btn-primary mt-4">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Radio size={15} />} Send broadcast
      </button>
      {done && <p className="mt-3 text-xs text-emerald-300">{done}</p>}
    </Card>
  );
}

/* ---------------- Health ---------------- */
function HealthTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api.get('/api/admin/health').then((d) => setData(d?.bot || {})).catch((e) => { setData(null); setError(e.message); });
  };

  useEffect(() => { load(); }, []);

  return (
    <Card className="max-w-xl">
      <div className="flex items-center gap-2">
        <HeartPulse size={16} />
        <h2 className="font-display font-semibold">Bot bridge health</h2>
        <button onClick={load} className="btn-ghost ml-auto px-2 py-1.5 text-xs">Recheck</button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {data && (
        <pre className="mt-4 overflow-x-auto rounded-xl border border-edge bg-void p-4 text-xs text-muted">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </Card>
  );
}