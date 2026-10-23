import { useEffect, useState } from 'react';
import {
  Shield, Users, FileText, Megaphone, ScrollText, Activity,
  Loader2, Crown, Ban, Trash2, Plus,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Badge, Avatar, Stat } from '../../components/ui';
import { nf, timeAgo, avatarUrl } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'broadcast', label: 'Broadcast', icon: Megaphone },
  { key: 'logs', label: 'Logs', icon: ScrollText },
];

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const notify = (ok, msg) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-accent" />
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted">{user.isOwner ? 'Full owner access' : 'Administrator access'}</p>
        </div>
      </div>

      {toast && <div className={'card p-3 text-sm ' + (toast.ok ? 'text-emerald-300' : 'text-red-300')}>{toast.msg}</div>}

      <div className="flex flex-wrap gap-1.5 border-b border-edge pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-colors border ' + (tab === t.key ? 'bg-white/10 text-white border-edge' : 'text-muted hover:text-white border-transparent')}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'users' && <UsersTab notify={notify} />}
      {tab === 'posts' && <PostsTab notify={notify} />}
      {tab === 'broadcast' && <BroadcastTab notify={notify} />}
      {tab === 'logs' && <LogsTab />}
    </div>
  );
}

function Overview() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/api/admin/overview').then(setD).catch(() => setD(false)); }, []);
  if (d === null) return <Loader />;
  if (d === false) return <p className="text-muted">Failed to load.</p>;
  const s = d.data;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Users" value={nf(s.users)} />
        <Stat label="Servers" value={nf(s.guilds)} />
        <Stat label="Commands (24h)" value={nf(s.commandsToday)} />
        <Stat label="Active Giveaways" value={nf(s.giveaways)} />
      </div>
      <Card>
        <h2 className="font-display font-semibold">Bot status</h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Badge tone={s.bot.online ? 'green' : 'red'}>{s.bot.online ? 'Online' : 'Offline'}</Badge>
          {s.bot.online && (
            <>
              <span className="text-muted">Latency: {s.bot.latency_ms}ms</span>
              <span className="text-muted">Guilds: {nf(s.bot.guild_count)}</span>
              <span className="text-muted">Commands: {nf(s.bot.command_count)}</span>
            </>
          )}
        </div>
      </Card>
      <Card>
        <h2 className="font-display font-semibold">Recent audit</h2>
        <div className="mt-3 divide-y divide-edge/60 text-sm">
          {s.recentAudit.map((a) => (
            <div key={a._id} className="flex justify-between py-2.5">
              <span>{a.action} <span className="text-muted">- {a.target}</span></span>
              <span className="text-xs text-muted">{a.actorName} - {timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function UsersTab({ notify }) {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');

  const load = () => api.get('/api/admin/users?q=' + encodeURIComponent(q)).then((d) => setRows(d.data)).catch(() => setRows([]));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);

  const act = async (fn, okMsg) => {
    try { await fn(); notify(true, okMsg); load(); }
    catch (e) { notify(false, e.message); }
  };

  if (rows === null) return <Loader />;
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-edge">
        <input className="input" placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {rows.map((u) => (
        <div key={u._id} className="flex items-center gap-3 border-b border-edge/60 p-3.5 last:border-0">
          <Avatar src={avatarUrl(u.discordId, u.avatar)} alt={u.username} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{u.globalName || u.username}</p>
            <p className="text-xs text-muted">{u.discordId} - {nf(u.totalCommands)} cmds</p>
          </div>
          <Badge tone={u.isPremium ? 'green' : 'default'}>{u.isPremium ? 'Premium' : 'Free'}</Badge>
          {u.isBanned && <Badge tone="red">Banned</Badge>}
          <div className="flex gap-1.5">
            <button
              title="Toggle premium"
              className="btn-ghost px-2.5 py-2"
              onClick={() => act(() => api.post('/api/admin/users/' + u.discordId + '/premium', { value: !u.isPremium }), 'Premium updated')}
            >
              <Crown size={14} />
            </button>
            <button
              title="Ban / unban"
              className="btn-ghost px-2.5 py-2"
              onClick={() => act(() => api.post('/api/admin/users/' + u.discordId + '/ban', { value: !u.isBanned }), 'Ban updated')}
            >
              <Ban size={14} />
            </button>
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">No users found.</p>}
    </Card>
  );
}

function PostsTab({ notify }) {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ type: 'blog', title: '', excerpt: '', content: '', coverImage: '', published: false });

  const load = () => api.get('/api/admin/posts').then((d) => setRows(d.data)).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/posts', form);
      notify(true, 'Post created');
      setForm({ ...form, title: '', excerpt: '', content: '' });
      load();
    } catch (err) { notify(false, err.message); }
  };

  const del = async (id) => {
    try { await api.delete('/api/admin/posts/' + id); notify(true, 'Deleted'); load(); }
    catch (e) { notify(false, e.message); }
  };

  const togglePub = async (p) => {
    try { await api.patch('/api/admin/posts/' + p._id, { published: !p.published }); load(); }
    catch (e) { notify(false, e.message); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="font-display font-semibold">New Post</h2>
        <form onSubmit={create} className="mt-4 space-y-3">
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="blog">Blog</option>
              <option value="news">News</option>
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Excerpt</label>
            <input className="input" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </div>
          <div>
            <label className="label">Cover image URL</label>
            <input className="input" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
          </div>
          <div>
            <label className="label">Content (Markdown)</label>
            <textarea className="input h-40 font-mono text-xs" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Publish immediately
          </label>
          <button className="btn-primary w-full"><Plus size={15} /> Create</button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-edge font-display font-semibold">All Posts</div>
        {rows === null ? <Loader /> : rows.map((p) => (
          <div key={p._id} className="flex items-center gap-3 border-b border-edge/60 p-3.5 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{p.title}</p>
              <p className="text-xs text-muted">{p.type} - {p.views} views</p>
            </div>
            <button onClick={() => togglePub(p)}>
              <Badge tone={p.published ? 'green' : 'amber'}>{p.published ? 'Live' : 'Draft'}</Badge>
            </button>
            <button onClick={() => del(p._id)} className="text-muted hover:text-red-400"><Trash2 size={14} /></button>
          </div>
        ))}
      </Card>
    </div>
  );
}

function BroadcastTab({ notify }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const r = await api.post('/api/admin/broadcast', { message: msg });
      notify(true, 'Broadcast queued (' + r.jobId + ')');
      setMsg('');
    } catch (e) { notify(false, e.message); }
    finally { setBusy(false); }
  };

  return (
    <Card>
      <h2 className="font-display font-semibold">DM Broadcast</h2>
      <p className="mt-1 text-xs text-muted">
        Sends a DM to every member of every server the bot is in. This can take a while.
      </p>
      <textarea className="input mt-4 h-32" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Your message..." />
      <button onClick={send} disabled={busy || !msg} className="btn-primary mt-3">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />} Send Broadcast
      </button>
    </Card>
  );
}

function LogsTab() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/api/admin/logs').then((d) => setRows(d.data)).catch(() => setRows([])); }, []);
  if (rows === null) return <Loader />;
  return (
    <Card className="p-0 overflow-hidden">
      {rows.map((l) => (
        <div key={l._id} className="flex items-center justify-between border-b border-edge/60 p-3.5 text-sm last:border-0">
          <span>{l.action} <span className="text-muted">- {l.target}</span></span>
          <span className="text-xs text-muted">{l.actorName} - {timeAgo(l.createdAt)} - {l.ip}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">No logs.</p>}
    </Card>
  );
}
