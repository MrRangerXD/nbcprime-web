import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { Badge } from './ui';

export const ADD_BOT_URL =
  'https://discord.com/oauth2/authorize?client_id=1481283105837940901&permissions=8&integration_type=0&scope=bot+applications.commands';

export const TIERS = [
  { id: 'free', label: 'Free', price: '₹0', usd: '$0', tagline: 'Start nuking today', cta: 'Add to Discord', href: ADD_BOT_URL,
    features: ['Full nuke engine', 'Backup & restore', 'Server branding', 'Channel & role creation', 'Community support'] },
  { id: '30d', label: 'Premium', price: '₹80', usd: '$0.84', tagline: 'per 30 days', cta: 'Get Premium', to: '/pricing', highlight: true,
    features: ['Everything in Free', 'banall · kickall · dmall', 'Chaos engine', 'Mass webhooks', 'Lockdown & purge-all', 'Custom nuke config'] },
  { id: 'life', label: 'Lifetime', price: '₹435', usd: '$4.57', tagline: 'pay once', cta: 'Go Lifetime', to: '/pricing',
    features: ['Everything in Premium', 'Never expires', 'Lifetime badge', 'Vote on roadmap', 'Direct dev line'] },
];

export default function PricingSection({ compact = false }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <div className="mb-12 text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">Pricing</p>
        <h2 className="font-display text-3xl font-bold md:text-4xl">Simple pricing, crypto only</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          No subscriptions to cancel, no card needed. Pay in LTC or SOL — premium unlocks automatically.
        </p>
      </div>

      <div className={'grid gap-5 ' + (compact ? 'md:grid-cols-3' : 'lg:grid-cols-3')}>
        {TIERS.map((t) => (
          <div key={t.id} className={'card relative p-6 ' + (t.highlight ? 'border-white/25 shadow-glow' : '')}>
            {t.highlight && <div className="absolute -top-3 left-6"><Badge tone="solid">MOST POPULAR</Badge></div>}
            <h3 className="font-display text-lg font-bold">{t.label}</h3>
            <p className="mt-1 text-xs text-dim">{t.tagline}</p>
            <div className="mt-5 flex items-end gap-2">
              <span className="mono font-display text-4xl font-bold">{t.price}</span>
              <span className="pb-1 text-xs text-muted">≈ {t.usd}</span>
            </div>
            <ul className="mt-6 space-y-2.5">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13px] text-muted">
                  <Check size={14} className="mt-0.5 shrink-0 text-white" /> {f}
                </li>
              ))}
            </ul>
            {t.href ? (
              <a href={t.href} target="_blank" rel="noreferrer" className={'mt-7 w-full ' + (t.highlight ? 'btn-primary' : 'btn-ghost')}>
                {t.cta}
              </a>
            ) : (
              <Link to={t.to} className={'mt-7 w-full ' + (t.highlight ? 'btn-primary' : 'btn-ghost')}>
                {t.highlight && <Sparkles size={14} />} {t.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}