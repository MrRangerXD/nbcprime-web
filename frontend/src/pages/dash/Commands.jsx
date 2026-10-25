import { useMemo, useState } from 'react';
import { Zap, Search, Crown, Copy, Check } from 'lucide-react';
import { COMMANDS, CATEGORIES, FREE_COUNT, VIP_COUNT } from '../../lib/commands';
import { Card, Badge } from '../../components/ui';

export default function Commands() {
  const [tier, setTier] = useState('free');
  const [cat, setCat] = useState('All');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMANDS
      .filter((c) => c.tier === tier)
      .filter((c) => cat === 'All' || c.cat === cat)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  }, [tier, cat, query]);

  const copy = (name) => {
    navigator.clipboard?.writeText(name).then(() => {
      setCopied(name);
      setTimeout(() => setCopied(''), 1200);
    });
  };

  const tierBtn = (value, label, count) => (
    <button
      onClick={() => { setTier(value); setCat('All'); }}
      className={
        'rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition ' +
        (tier === value ? 'border-white bg-white text-black' : 'border-edge text-muted hover:text-white')
      }
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Command List</h1>
          <p className="mt-1.5 text-sm text-muted">
            {COMMANDS.length} commands total · {FREE_COUNT} free · {VIP_COUNT} VIP
          </p>
        </div>
        <div className="flex gap-2">
          {tierBtn('free', 'Free', FREE_COUNT)}
          {tierBtn('vip', 'VIP', VIP_COUNT)}
        </div>
      </div>

      <Card>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="input pl-10"
          />
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {['All', ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ' +
                (cat === c ? 'border-white bg-white text-black' : 'border-edge text-muted hover:border-white/30 hover:text-white')
              }
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-dim">{list.length} result(s)</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <div key={c.name} className="group rounded-xl border border-edge bg-surface/40 p-4 transition hover:border-white/25">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {c.tier === 'vip'
                    ? <Crown size={14} className="shrink-0 text-amber-300" />
                    : <Zap size={14} className="shrink-0 text-white/70" />}
                  <span className="mono truncate text-sm font-semibold">{c.name}</span>
                  <button
                    onClick={() => copy(c.name)}
                    title="Copy"
                    className="shrink-0 text-dim opacity-0 transition group-hover:opacity-100 hover:text-white"
                  >
                    {copied === c.name ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <Badge tone={c.tier === 'vip' ? 'amber' : 'default'}>
                  {c.tier === 'vip' ? 'VIP' : 'FREE'}
                </Badge>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted">{c.desc}</p>

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-dim">
                <span className="rounded border border-edge px-1.5 py-0.5">{c.cat}</span>
                {c.args && <span><b className="text-white/60">Args:</b> {c.args}</span>}
                {c.req && <span><b className="text-white/60">Needs:</b> {c.req}</span>}
              </div>
            </div>
          ))}

          {list.length === 0 && (
            <p className="py-8 text-sm text-muted sm:col-span-2 xl:col-span-3">No commands match that search.</p>
          )}
        </div>
      </Card>
    </div>
  );
}