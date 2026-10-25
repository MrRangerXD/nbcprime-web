import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Server, Users, Terminal, Zap, Trophy, Gift, Activity,
  SlidersHorizontal, RefreshCw, Terminal as TerminalIcon, Crown,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Stat, Card, Loader, Avatar, Badge, Empty } from '../../components/ui';
import { nf } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import DiscordPreview from '../../components/DiscordPreview';

const healthOf = (ms) => {
  if (ms == null) return { label: 'Unknown', tone: 'default' };
  if (ms < 200) return { label: 'Healthy', tone: 'green' };
  if (ms < 500) return { label: 'Elevated', tone: 'amber' };
  return { label: 'Degraded', tone: 'red' };
};

export default function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [top, setTop] = useState([]);
  const [activity, setActivity] = useState([]);
  const [config, setConfig] = useState(null);
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);

    const [s, t, a, c] = await Promise.allSettled([
      api.get('/api/public/stats'),
      api.get('/api/public/leaderboard/users?limit=5'),
      api.get('/api/leaderboard/activity?days=14'),
      api.get('/api/me/nuke-config'),
    ]);

    if (s.status === 'fulfilled') setStats(s.value?.stats || null);
    else setFailed(true);

    if (t.status === 'fulfilled') setTop(Array.isArray(t.value?.data) ? t.value.data : []);
    if (a.status === 'fulfilled') setActivity(Array.isArray(a.value?.data) ? a.value.data : []);
    if (c.status === 'fulfilled') {
      setConfig(c.value?.data?.config || null);
      setIsDefault(c.value?.data?.isDefault !== false);
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader label="Loading dashboard" />;

  if (failed && !stats) {
    return (
      <Empty
        title="Could not reach the API"
        sub="Backend band hai ya VITE_API_URL galat hai."
        action={
          <button onClick={load} className="btn-primary">
            <RefreshCw size={15} /> Retry
          </button>
        }
      />
    );
  }

  const max = Math.max(1, ...activity.map((a) => a.count || 0));
  const health = healthOf(stats?.latency);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Welcome back, {user.globalName || user.username}
          </h1>
          <p className="mt-1.5 text-sm text-muted">Manage your nuke performance and server activity.</p>
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Servers" value={nf(stats?.guilds)} icon={Server} />
        <Stat label="Member Reach" value={nf(stats?.members)} icon={Users} />
        <Stat label="Commands" value={nf(stats?.commands)} icon={Terminal} />
        <Stat
          label="Gateway"
          value={stats?.latency != null ? stats.latency + 'ms' : '—'}
          icon={Zap}
          hint={health.label}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            <h2 className="font-display font-semibold">Command activity (14d)</h2>
          </div>

          {activity.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No data yet — run a command to start tracking.</p>
          ) : (
            <>
              <div className="mt-6 flex h-40 items-end gap-1.5">
                {activity.map((a) => (
                  <div
                    key={a.date}
                    className="group relative flex-1"
                    title={`${a.date}: ${a.count}`}
                  >
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-white/15 to-white/70 transition group-hover:from-white/25 group-hover:to-white"
                      style={{ height: `${Math.max((a.count / max) * 100, 4)}%`, minHeight: 4 }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-dim">
                <span>{activity[0]?.date}</span>
                <span>{activity[activity.length - 1]?.date}</span>
              </div>
            </>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-300" />
              <h2 className="font-display font-semibold">Top Users</h2>
            </div>
            <Link to="/dashboard/top-users" className="text-xs text-muted hover:text-white">All</Link>
          </div>

          <div className="mt-4 space-y-2">
            {top.length === 0 && <p className="text-sm text-muted">No data yet.</p>}
            {top.map((u, i) => (
              <div key={u.id || i} className="flex items-center gap-3 rounded-xl border border-edge bg-surface/40 p-2.5">
                <span className={'w-5 text-sm font-bold ' + (i === 0 ? 'text-amber-300' : 'text-muted')}>
                  #{i + 1}
                </span>
                <Avatar src={u.avatar} alt={u.name} size={28} />
                <span className="flex-1 truncate text-sm">{u.name || 'Unknown'}</span>
                <span className="mono text-xs text-white/70">{nf(u.count)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-accent" />
              <h2 className="font-display font-semibold">Current Nuke Config</h2>
            </div>
            <Badge tone={isDefault ? 'default' : 'green'}>{isDefault ? 'Defaults' : 'Custom'}</Badge>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Parameters deployed when you execute a nuke command on Discord.
          </p>

          {config ? (
            <div className="mt-4 space-y-2 text-sm">
              {[
                ['New Server Name', config.serverName],
                ['Custom Channel Name', config.customChannelName],
                ['Channels Created', config.channelCount ? `${config.channelCount} channels` : null],
                ['Spam Message', config.spamMessage],
                ['Server Icon', config.serverIconUrl],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4 rounded-lg border border-edge bg-surface/40 px-3 py-2">
                    <span className="shrink-0 text-xs text-muted">{k}</span>
                    <span className="max-w-[60%] truncate text-right text-xs font-medium">{v}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Using built-in defaults.</p>
          )}

          <Link to="/dashboard/customization" className="btn-primary mt-5 block py-3 text-center text-sm">
            Customize Config
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <TerminalIcon size={16} className="text-accent" />
            <h2 className="font-display font-semibold">Discord Live Preview</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted">How the nuke will look inside Discord.</p>
          <div className="mt-4">
            <DiscordPreview
              config={
                config || {
                  serverName: 'NBC ON TOP',
                  channelName: 'raided-by-nbc',
                  channelCount: 100,
                  spamMessage: 'Server destroyed by NBC',
                }
              }
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/dashboard/servers', icon: Server, title: 'Manage Servers', sub: 'Control every server.' },
          { to: '/dashboard/giveaways', icon: Gift, title: 'Giveaways', sub: 'Launch and end remotely.' },
          { to: '/dashboard/commands', icon: TerminalIcon, title: 'Command List', sub: 'Full command reference.' },
          { to: '/dashboard/premium', icon: Crown, title: 'Premium', sub: 'Unlock VIP commands.' },
        ].map((q) => (
          <Link key={q.to} to={q.to} className="card card-hover flex items-center gap-4 p-5">
            <q.icon size={20} className="shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="truncate font-medium">{q.title}</p>
              <p className="truncate text-xs text-muted">{q.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}