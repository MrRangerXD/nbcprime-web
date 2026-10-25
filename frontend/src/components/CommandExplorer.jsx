import { useMemo, useState } from 'react';
import { Search, Copy, Check } from 'lucide-react';
import { COMMANDS, CATEGORIES } from '../lib/commands';
import { Badge, Pill } from './ui';

export default function CommandExplorer({ compact = false }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [tier, setTier] = useState('all');
  const [copied, setCopied] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMANDS.filter((c) => {
      if (cat !== 'All' && c.cat !== cat) return false;
      if (tier !== 'all' && c.tier !== tier) return false;
      if (q && !c.name.includes(q) && !c.desc.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, cat, tier]);

  const copy = async (name) => {
    try {
      await writeClipboard(`>${name}`);
      setCopied(name);
      setTimeout(() => setCopied(''), 1200);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
          <input className="input pl-10" placeholder="Search commands..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Pill active={tier === 'all'} onClick={() => setTier('all')}>All</Pill>
          <Pill active={tier === 'free'} onClick={() => setTier('free')}>Free</Pill>
          <Pill active={tier === 'premium'} onClick={() => setTier('premium')}>Premium</Pill>
        </div>
      </div>

      {!compact && (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          <Pill active={cat === 'All'} onClick={() => setCat('All')}>All</Pill>
          {CATEGORIES.map((c) => <Pill key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Pill>)}
        </div>
      )}

      <div className="mt-5 max-h-[520px] space-y-2 overflow-y-auto pr-1">
        {list.map((c) => (
          <div key={c.name + c.cat} className="flex items-start gap-3 rounded-xl border border-edge bg-surface/40 p-3.5 transition hover:border-white/20">
            <button onClick={() => copy(c.name)} className="mt-0.5 shrink-0 rounded-lg border border-edge p-1.5 text-muted transition hover:border-white/30 hover:text-white">
              {copied === c.name ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <code className="mono text-sm text-white">&gt;{c.name}</code>
                <Badge tone={c.tier === 'premium' ? 'solid' : 'default'}>{c.tier === 'premium' ? 'PREMIUM' : 'FREE'}</Badge>
                <span className="text-[11px] text-dim">{c.cat}</span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{c.desc}</p>
            </div>
          </div>
        ))}
        {!list.length && <p className="py-8 text-center text-sm text-dim">No commands match.</p>}
      </div>
    </div>
  );
}
