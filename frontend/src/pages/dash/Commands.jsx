import { useMemo, useState } from 'react';
import { Zap, Search, Crown } from 'lucide-react';
import { COMMANDS, FREE_COUNT, VIP_COUNT } from '../../lib/nukeCommands';
import { Card, Badge } from '../../components/ui';

export default function Commands() {
  const [tier, setTier] = useState('free');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMANDS.filter((c) => c.tier === tier)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  }, [tier, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Command List</h1>
        <p className="mt-1.5 text-sm text-muted">
          Browse the arsenal of {COMMANDS.length} nuke, raid, spam, and server utility commands.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold">NBCPrime Command List</h2>
            <p className="mt-1 text-xs text-muted">
              Total of {list.length} commands ready for execution.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTier('free')}
              className={
                'rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition ' +
                (tier === 'free' ? 'border-white bg-white text-black' : 'border-edge text-muted hover:text-white')
              }
            >
              Free ({FREE_COUNT})
            </button>
            <button
              onClick={() => setTier('vip')}
              className={
                'rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition ' +
                (tier === 'vip' ? 'border-white bg-white text-black' : 'border-edge text-muted hover:text-white')
              }
            >
              VIP ({VIP_COUNT})
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="w-full rounded-xl border border-edge bg-void py-3 pl-10 pr-4 text-sm outline-none transition focus:border-accent"
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <div key={c.name} className="rounded-xl border border-edge bg-surface/40 p-4 transition hover:border-accent/40">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {c.tier === 'vip' ? (
                    <Crown size={14} className="text-amber-300" />
                  ) : (
                    <Zap size={14} className="text-accent" />
                  )}
                  <span className="mono text-sm font-semibold">{c.name}</span>
                </div>
                <Badge tone={c.tier === 'vip' ? 'amber' : 'default'}>
                  {c.tier === 'vip' ? 'VIP' : 'Free'}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{c.desc}</p>
              {c.args && (
                <p className="mt-2 text-[11px] text-dim">
                  <span className="font-semibold text-white/70">Arguments:</span> {c.args}
                </p>
              )}
              {c.req && (
                <p className="mt-1 text-[11px] text-dim">
                  <span className="font-semibold text-white/70">Requirements:</span> {c.req}
                </p>
              )}
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-muted">No commands match that search.</p>}
        </div>
      </Card>
    </div>
  );
}
