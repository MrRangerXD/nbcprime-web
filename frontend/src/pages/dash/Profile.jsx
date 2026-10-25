import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Gift, Server, Crown, Shield, LogOut } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Stat, Badge, Avatar, Empty } from '../../components/ui';
import { nf, timeAgo } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/api/me/stats')
      .then((d) => { if (alive) setStats(d?.data || null); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-5">
        <Avatar src={user.avatar} alt={user.username} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">{user.globalName || user.username}</h1>
          <p className="mono text-xs text-dim">{user.id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.isOwner && <Badge tone="solid">OWNER</Badge>}
            {user.isAdmin && !user.isOwner && <Badge tone="amber">ADMIN</Badge>}
            {user.isPremium && <Badge tone="green">PREMIUM</Badge>}
            {!user.isPremium && <Badge>FREE</Badge>}
          </div>
        </div>
        <button onClick={logout} className="btn-ghost"><LogOut size={14} /> Logout</button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Commands" value={nf(stats?.totalCommands)} icon={Terminal} />
        <Stat label="Giveaways" value={nf(stats?.giveawaysHosted)} icon={Gift} />
        <Stat label="Admin Servers" value={nf(stats?.adminGuildCount)} icon={Server} />
        <Stat
          label="Premium"
          value={user.isPremium ? 'Active' : 'Free'}
          icon={Crown}
          hint={user.premiumUntil ? `until ${new Date(user.premiumUntil).toLocaleDateString()}` : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display font-semibold">Your top commands</h2>
          <div className="mt-4 space-y-2">
            {(stats?.topCommands || []).length === 0 && <p className="text-sm text-muted">No commands yet.</p>}
            {(stats?.topCommands || []).map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-lg border border-edge bg-surface/40 px-3 py-2">
                <code className="mono text-xs">{c.name}</code>
                <span className="mono text-xs text-muted">{nf(c.count)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display font-semibold">Recent activity</h2>
          <div className="mt-4 divide-y divide-edge">
            {(stats?.recent || []).length === 0 && <p className="py-3 text-sm text-muted">Nothing yet.</p>}
            {(stats?.recent || []).slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2.5 text-sm">
                <code className="mono text-xs">{r.command}</code>
                <span className="truncate text-[11px] text-dim">{r.guildName || 'DM'}</span>
                <span className="ml-auto shrink-0 text-[11px] text-dim">{timeAgo(r.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {user.isAdmin && (
        <Card className="flex items-center gap-4">
          <Shield size={20} className="text-amber-300" />
          <div className="flex-1">
            <p className="font-medium">Admin access</p>
            <p className="text-xs text-muted">You can manage users, posts and premium.</p>
          </div>
          <Link to="/dashboard/admin" className="btn-primary">Open Admin Panel</Link>
        </Card>
      )}
    </div>
  );
}