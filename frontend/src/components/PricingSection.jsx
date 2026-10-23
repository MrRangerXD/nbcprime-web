import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Flame } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const FALLBACK = [
  { id: '10d',  label: '10 Days',  inr: 30,  usd: 0.32, tag: 'Starter' },
  { id: '30d',  label: '30 Days',  inr: 80,  usd: 0.84, tag: 'Best value', popular: true },
  { id: 'life', label: 'Lifetime', inr: 435, usd: 4.57, tag: 'Forever' },
];

const PERKS = [
  'Unlimited nukes & mass actions',
  'Zero command cooldowns',
  'Priority action queue (front of line)',
  'Premium badge on profile + leaderboard',
  'Early access to new commands',
];

export default function PricingSection() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState(FALLBACK);

  useEffect(() => {
    api.get('/api/premium/plans')
      .then((r) => {
        if (!r?.plans) return;
        setPlans(r.plans.map((p) => ({ ...p, popular: p.id === '30d', tag: p.id === 'life' ? 'Forever' : p.id === '30d' ? 'Best value' : 'Starter' })));
      })
      .catch(() => {});
  }, []);

  const go = () => (user ? navigate('/dashboard/premium') : login());

  return (
    <section id="pricing" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Crown size={12} /> NBCPrime Premium
        </span>
        <h2 className="mt-5 font-display text-3xl font-bold md:text-4xl">Unlock the full arsenal</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Free plan unlimited hai lekin cooldowns ke saath. Premium me sab kuch instant, no waiting.
          Crypto se pay karo — auto-activate, admin ki zaroorat nahi.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {plans.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={'card relative flex flex-col p-6 ' + (p.popular ? 'border-accent/50 shadow-glow' : '')}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold text-white">
                MOST POPULAR
              </span>
            )}
            <div className="text-[11px] uppercase tracking-wider text-muted">{p.tag}</div>
            <div className="mt-3 font-display text-xl font-bold">{p.label}</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold glow-text">₹{p.inr}</span>
              <span className="text-sm text-muted">≈ ${Number(p.usd).toFixed(2)}</span>
            </div>

            <ul className="mt-5 flex-1 space-y-2.5">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm text-muted">
                  <Check size={15} className="mt-0.5 shrink-0 text-accent" />
                  {perk}
                </li>
              ))}
            </ul>

            <button onClick={go} className={'mt-6 w-full ' + (p.popular ? 'btn-primary' : 'btn-ghost')}>
              {p.popular ? <Flame size={16} /> : <Sparkles size={16} />}
              Get {p.label}
            </button>
          </motion.div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Accepted: <span className="text-white/70">Litecoin (LTC)</span> · <span className="text-white/70">Solana (SOL)</span> — manual verify, no card needed.
      </p>
    </section>
  );
}
