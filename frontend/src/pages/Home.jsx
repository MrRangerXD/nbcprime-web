import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Zap, Shield, Trophy, Users, Server, Terminal, ArrowRight, Gift } from 'lucide-react';
import { api } from '../lib/api';
import { nf, avatarUrl } from '../lib/format';
import { Stat, Badge, Avatar } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: Rocket, title: 'Remote Nuke', desc: 'Wipe a server from your browser. Parallel deletion, creation and spam in one shot.' },
  { icon: Zap, title: 'Zero Rate Limits', desc: 'Semaphore and jitter engine tuned to survive 5000-request raids without a 429.' },
  { icon: Gift, title: 'Giveaway Engine', desc: 'Host, end and reroll giveaways straight from the dashboard.' },
  { icon: Trophy, title: 'Live Leaderboards', desc: 'Global top users and top servers, updated in real time.' },
  { icon: Shield, title: 'Whitelist Protection', desc: 'Mark a server as protected so no raid touches it.' },
  { icon: Terminal, title: 'Full Command Set', desc: '60+ prefix and slash commands, all remotely triggerable.' },
];

export default function Home() {
  const { user, login } = useAuth();
  const [stats, setStats] = useState(null);
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    api.get('/api/public/stats').then((d) => setStats(d.stats)).catch(() => {});
    api.get('/api/public/leaderboard/users?limit=5').then((d) => setTopUsers(d.data || [])).catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative grid-bg border-b border-edge">
        <div className="mx-auto max-w-7xl px-5 py-24 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge tone="purple" className="mb-6">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulseGlow" />
              {stats ? 'Bot online' : 'Connecting'}
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight glow-text">
              THE ULTIMATE<br /><span className="text-accent">DISCORD NUKE BOT</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-muted">
              Delete everything. Rebuild everything. From one dashboard. NBCPrime is the nuke bot trusted by thousands of servers.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary">Open Dashboard <ArrowRight size={16} /></Link>
              ) : (
                <button onClick={login} className="btn-primary">Sign in with Discord <ArrowRight size={16} /></button>
              )}
              <a
                href="https://discord.com/oauth2/authorize?client_id=1455472629912965211&permissions=8&integration_type=0&scope=bot+applications.commands"
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                <img src="/logo.png" alt="" className="h-4 w-4 rounded" /> Add to Server
              </a>
            </div>
          </motion.div>

          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Servers" value={nf(stats && stats.guilds)} icon={Server} />
            <Stat label="Member Reach" value={nf(stats && stats.members)} icon={Users} />
            <Stat label="Commands Run" value={nf(stats && stats.commands)} icon={Terminal} />
            <Stat label="Gateway" value={stats && stats.latency ? stats.latency + 'ms' : '-'} icon={Zap} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24">
        <h2 className="font-display text-3xl md:text-4xl font-bold">Built for destruction</h2>
        <p className="mt-3 text-muted">Everything you need, nothing you don't.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card card-hover p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <f.icon size={18} className="text-accent" />
              </div>
              <h3 className="mt-4 font-display font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {topUsers.length > 0 && (
        <section className="border-y border-edge bg-panel/40">
          <div className="mx-auto max-w-7xl px-5 py-24">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold">Top Users</h2>
                <p className="mt-2 text-muted text-sm">The people pressing the red button the most.</p>
              </div>
              <Link to="/dashboard/top-users" className="btn-ghost hidden md:inline-flex">View all</Link>
            </div>
            <div className="mt-8 space-y-2">
              {topUsers.map((u, i) => (
                <div key={u.id} className="card flex items-center gap-4 p-4">
                  <span className="font-display w-8 text-lg font-bold text-muted">#{i + 1}</span>
                  <Avatar src={u.avatar || avatarUrl(u.id, null)} alt={u.name} />
                  <span className="flex-1 truncate font-medium">{u.name}</span>
                  <Badge tone="purple">{nf(u.count)} cmds</Badge>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 py-24">
        <div className="card relative overflow-hidden p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />
          <h2 className="relative font-display text-4xl font-bold glow-text">Ready to nuke?</h2>
          <p className="relative mt-3 text-muted">Sign in with Discord and take control.</p>
          {user ? (
            <Link to="/dashboard" className="relative btn-primary mt-8 inline-flex">Go to Dashboard</Link>
          ) : (
            <button onClick={login} className="relative btn-primary mt-8">Sign in with Discord</button>
          )}
        </div>
      </section>
    </div>
  );
}
