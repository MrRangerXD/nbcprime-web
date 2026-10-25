import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket, Zap, Shield, Users, Server, Terminal, ArrowRight, Gift,
  Trophy, Command, Layers, Clock, ChevronRight, MousePointerClick, Crown,
} from 'lucide-react';
import { api } from '../lib/api';
import { nf, avatarUrl } from '../lib/format';
import { Stat, Badge, Avatar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import PricingSection from '../components/PricingSection';
import VideoSection from '../components/VideoSection';
import Faq from '../components/Faq';
import { MARQUEE_COMMANDS, TOTAL_COMMANDS, VIP_COUNT } from '../lib/commands';

const ADD_BOT_URL =
  'https://discord.com/oauth2/authorize?client_id=1563885964567257128&permissions=8&integration_type=0&scope=bot+applications.commands';

const features = [
  { icon: Rocket, title: 'Remote Nuke', desc: 'Wipe a server from your browser. Parallel deletion, creation and spam in one shot.' },
  { icon: Zap, title: 'Zero Rate Limits', desc: 'A semaphore and jitter engine tuned to survive 5,000-request raids without a single 429.' },
  { icon: Gift, title: 'Giveaway Engine', desc: 'Host, pause, end and reroll giveaways straight from the dashboard or from chat.' },
  { icon: Trophy, title: 'Live Leaderboards', desc: 'Global top users and top servers, ranked by real usage and updated in real time.' },
  { icon: Shield, title: 'Anti-Nuke Shield', desc: 'Whitelist trusted users, set action limits and let the shield kill raids before they land.' },
  { icon: Layers, title: 'Backup & Restore', desc: 'Snapshot channels, roles and settings, then restore them into any server you own.' },
];

const steps = [
  { icon: MousePointerClick, title: '1. Add the bot', desc: 'Invite NBCPrime to your server in one click. Administrator permission required.' },
  { icon: Layers, title: '2. Sign in with Discord', desc: 'Log into the dashboard. Every server where you are admin is detected automatically.' },
  { icon: Rocket, title: '3. Press the button', desc: 'Pick a server, choose a template and nuke. Channels and roles rebuild in seconds.' },
];

const proof = [
  { quote: 'Deleted 340 channels in one click. It used to take me two hours.', name: 'Aarav', role: 'Owner, 60k member server' },
  { quote: 'The rate limit engine is unreal. Not a single 429 in three months.', name: 'Kabir', role: 'Community Manager' },
  { quote: 'The leaderboard keeps our server alive. People actually compete now.', name: 'Ishita', role: 'Server Admin' },
];

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function Home() {
  const { user, login } = useAuth();
  const [stats, setStats] = useState(null);
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    let alive = true;
    api.get('/api/public/stats')
      .then((d) => { if (alive) setStats(d?.stats || null); })
      .catch(() => {});
    api.get('/api/public/leaderboard/users?limit=5')
      .then((d) => { if (alive) setTopUsers(Array.isArray(d?.data) ? d.data : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const online = Boolean(stats);

  return (
    <div>
      {/* ---------------- HERO ---------------- */}
      <section className="relative grid-bg overflow-hidden border-b border-edge">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[46rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-void/60" />

        <div className="relative mx-auto max-w-7xl px-5 py-24 text-center md:py-32">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge tone={online ? 'green' : 'default'} className="mb-6">
              <span
                className={
                  'mr-1.5 inline-block h-1.5 w-1.5 rounded-full ' +
                  (online ? 'animate-pulseGlow bg-emerald-400' : 'bg-amber-400')
                }
              />
              {online ? 'All systems online' : 'Connecting to gateway'}
            </Badge>

            <h1 className="font-display text-5xl font-bold leading-[1.06] tracking-tight md:text-7xl">
              THE ULTIMATE
              <br />
              <span className="text-gradient">DISCORD NUKE BOT</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-muted">
              Delete everything. Rebuild everything. From one dashboard. {TOTAL_COMMANDS} prefix
              commands, {VIP_COUNT} of them VIP, trusted by thousands of servers.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary">
                  Open Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <button onClick={login} className="btn-primary">
                  Sign in with Discord <ArrowRight size={16} />
                </button>
              )}

              <a href={ADD_BOT_URL} target="_blank" rel="noreferrer" className="btn-ghost">
                <img src="/logo.png" alt="" className="h-4 w-4 rounded" /> Add to Server
              </a>

              <Link to="/dashboard/commands" className="btn-ghost">
                Browse {TOTAL_COMMANDS} commands <ArrowRight size={15} />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Command size={13} className="text-accent" /> {TOTAL_COMMANDS} commands
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Crown size={13} className="text-amber-300" /> Free &amp; VIP tiers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield size={13} className="text-accent" /> Admin permission only
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-accent" /> Setup in 60 seconds
              </span>
            </div>
          </motion.div>

          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Servers" value={nf(stats?.guilds)} icon={Server} />
            <Stat label="Member Reach" value={nf(stats?.members)} icon={Users} />
            <Stat label="Commands Run" value={nf(stats?.commands)} icon={Terminal} />
            <Stat label="Gateway" value={stats?.latency ? stats.latency + 'ms' : '—'} icon={Zap} />
          </div>
        </div>
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <section className="border-b border-edge bg-panel/40 py-6">
        <div className="marquee-mask">
          <div className="marquee-track animate-marquee">
            {[...MARQUEE_COMMANDS, ...MARQUEE_COMMANDS].map((name, i) => (
              <span
                key={name + i}
                className="mr-3 whitespace-nowrap rounded-xl border border-edge bg-surface/60 px-4 py-2 font-mono text-xs text-muted"
              >
                &gt;{name}
                <span className="mx-2 text-white/20">·</span>
                <span className="text-white/50">!{name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- VIDEO ---------------- */}
      <VideoSection />

      {/* ---------------- FEATURES ---------------- */}
      <section className="mx-auto max-w-7xl px-5 py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-edge px-3 py-1 text-xs text-muted">
            <Command size={12} /> Features
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold md:text-4xl">Built for destruction</h2>
          <p className="mt-3 text-muted">Everything you need, nothing you don&apos;t.</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} {...reveal(i * 0.05)} className="card card-hover p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <f.icon size={18} className="text-accent" />
              </div>
              <h3 className="mt-4 font-display font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- STEPS ---------------- */}
      <section className="border-y border-edge bg-panel/40">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Three steps. That&apos;s it.</h2>
          <p className="mt-3 text-muted">No config files, no self-hosting, no dependencies.</p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div key={s.title} {...reveal(i * 0.08)} className="card relative overflow-hidden p-6">
                <span className="absolute right-5 top-2 font-display text-6xl font-bold text-white/5">
                  {i + 1}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <s.icon size={18} className="text-accent" />
                </div>
                <h3 className="mt-4 font-display font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- TOP USERS ---------------- */}
      {topUsers.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold">Top Users</h2>
              <p className="mt-2 text-sm text-muted">The people pressing the red button the most.</p>
            </div>
            <Link to="/dashboard/top-users" className="btn-ghost hidden md:inline-flex">
              View all <ChevronRight size={15} />
            </Link>
          </div>

          <div className="mt-8 space-y-2">
            {topUsers.map((u, i) => (
              <motion.div
                key={u.id || i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="card flex items-center gap-4 p-4"
              >
                <span
                  className={
                    'w-8 font-display text-lg font-bold ' +
                    (i === 0 ? 'text-amber-300' : i === 1 ? 'text-white/80' : i === 2 ? 'text-amber-600' : 'text-muted')
                  }
                >
                  #{i + 1}
                </span>
                <Avatar src={u.avatar || avatarUrl(u.id, null)} alt={u.name} />
                <span className="flex-1 truncate font-medium">{u.name || 'Unknown'}</span>
                <Badge>{nf(u.count)} cmds</Badge>
              </motion.div>
            ))}
          </div>

          <Link to="/dashboard/top-users" className="btn-ghost mt-5 w-full md:hidden">
            View all <ChevronRight size={15} />
          </Link>
        </section>
      )}

      {/* ---------------- PRICING ---------------- */}
      <PricingSection />

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="border-y border-edge bg-panel/40">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <h2 className="font-display text-3xl font-bold md:text-4xl">What people say</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {proof.map((p, i) => (
              <motion.div key={p.name} {...reveal(i * 0.06)} className="card p-6">
                <p className="text-sm leading-relaxed text-white/80">&ldquo;{p.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3 border-t border-edge pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 font-display text-sm font-bold text-accent">
                    {p.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <Faq />

      {/* ---------------- CTA ---------------- */}
      <section className="border-t border-edge">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <div className="card relative overflow-hidden p-12 text-center">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
            <div className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-accent/20 blur-[100px]" />
            <h2 className="relative font-display text-4xl font-bold glow-text">Ready to nuke?</h2>
            <p className="relative mt-3 text-muted">
              Sign in with Discord, pick a server, and take control in under a minute.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary">
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <button onClick={login} className="btn-primary">
                  Sign in with Discord <ArrowRight size={16} />
                </button>
              )}
              <a href={ADD_BOT_URL} target="_blank" rel="noreferrer" className="btn-ghost">
                <img src="/logo.png" alt="" className="h-4 w-4 rounded" /> Add to Server
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}