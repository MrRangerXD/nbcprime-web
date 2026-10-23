import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Loader, Badge, Stat } from '../../components/ui';
import { avatarUrl, nf } from '../../lib/format';

export default function Profile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/me/stats').then((d) => setStats(d.data)).catch(() => setStats(false));
  }, []);

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-5">
        <img src={avatarUrl(user.id, user.avatar)} alt="" className="h-20 w-20 rounded-2xl border border-edge" />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{user.globalName || user.username}</h1>
          <p className="text-sm text-muted">@{user.username} — {user.id}</p>
          <div className="mt-2 flex gap-1.5">
            {user.isOwner && <Badge tone="purple">Owner</Badge>}
            {user.isAdmin && !user.isOwner && <Badge tone="amber">Admin</Badge>}
            {user.isPremium && <Badge tone="green">Premium</Badge>}
          </div>
        </div>
        <button onClick={logout} className="btn-ghost">Sign out</button>
      </Card>

      {stats === null ? <Loader /> : stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Commands Used" value={nf(stats.totalCommands)} />
          <Stat label="Giveaways Hosted" value={nf(stats.giveawaysHosted)} />
          <Stat label="Admin Servers" value={nf(stats.adminGuildCount)} />
        </div>
      )}

      {stats && stats.topCommands?.length > 0 && (
        <Card>
          <h2 className="font-display font-semibold">Your top commands</h2>
          <div className="mt-3 space-y-2">
            {stats.topCommands.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-xl border border-edge bg-surface/40 px-3 py-2 text-sm">
                <span>/{c.name}</span>
                <span className="text-accent">{nf(c.count)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {stats && stats.recent?.length > 0 && (
        <Card>
          <h2 className="font-display font-semibold">Recent activity</h2>
          <div className="mt-3 divide-y divide-edge/60 text-sm">
            {stats.recent.map((r, i) => (
              <div key={r._id || `${r.command}-${i}`} className="flex justify-between py-2.5">
                <span>/{r.command}</span>
                <span className="text-xs text-muted">{r.guildName || 'DM'}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
