import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, Users, Terminal, Zap, Trophy, Gift, Activity } from 'lucide-react';
import { api } from '../../lib/api';
import { Stat, Card, Loader, Avatar } from '../../components/ui';
import { nf } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

export default function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);
  const [top, setTop] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get('/api/public/stats').then((d) => alive && setStats(d.stats)).catch(() => alive && setFailed(true)),
      api.get('/api/public/leaderboard/users?limit=5').then((d) => alive && setTop(d.data || [])).catch(() => {}),
      api.get('/api/leaderboard/activity?days=14').then((d) => alive && setActivity(d.data || [])).catch(() => {}),
    ]);
    return () => { alive = false; };
  }, []);

  if (failed && !stats) {
    return (
      <Card className="text-center">
        <p className="font-display text-lg">Could not reach the API</p>
        <p className="mt-1 text-sm text-muted">Check that the backend is running and VITE_API_URL is correct.</p>
      </Card>
    );
  }
  if (!stats) return <Loader label="Loading dashboard" />;

  const max = Math.max(...activity.map((a) => a.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Welcome back, {user.globalName || user.username}</h1>
        <p className="mt-1.5 text-sm text-muted">Live bot telemetry and your control surface.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Servers" value={nf(stats.guilds)} icon={Server} />
        <Stat label="Member Reach" value={nf(stats.members)} icon={Users} />
        <Stat label="Commands" value={nf(stats.commands)} icon={Terminal} />
        <Stat
          label="Gateway"
          value={stats.latency ? stats.latency + 'ms' : '-'}
          icon={Zap}
          hint={stats.latency && stats.latency < 200 ? 'Healthy' : 'Elevated'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            <h2 className="font-display font-semibold">Command activity (14d)</h2>
          </div>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {activity.length === 0 && <p className="text-sm text-muted">No data yet.</p>}
            {activity.map((a) => (
              <div key={a.date} className="flex-1" title={a.date + ': ' + a.count}>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-accent/30 to-accent"
                  style={{ height: (a.count / max) * 100 + '%', minHeight: 4 }}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-300" />
              <h2 className="font-display font-semibold">Top Users</h2>
            </div>
            <Link to="/dashboard/top-users" className="text-xs text-muted hover:text-accent">All</Link>
          </div>
          <div className="mt-4 space-y-2">
            {top.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-edge bg-surface/40 p-2.5">
                <span className="w-5 text-sm font-bold text-muted">#{i + 1}</span>
                <Avatar src={u.avatar} alt={u.name} size={28} />
                <span className="flex-1 truncate text-sm">{u.name}</span>
                <span className="text-xs text-accent">{nf(u.count)}</span>
              </div>
            ))}
            {top.length === 0 && <p className="text-sm text-muted">No data yet.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/dashboard/servers" className="card card-hover flex items-center gap-4 p-5">
          <Server className="text-accent" />
          <div>
            <p className="font-medium">Manage Servers</p>
            <p className="text-xs text-muted">Browse and control every server the bot is in.</p>
          </div>
        </Link>
        <Link to="/dashboard/giveaways" className="card card-hover flex items-center gap-4 p-5">
          <Gift className="text-accent" />
          <div>
            <p className="font-medium">Giveaways</p>
            <p className="text-xs text-muted">Launch and end giveaways remotely.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
