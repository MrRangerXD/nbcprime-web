import { useMemo, useState } from 'react';
import { Search, Terminal, Zap, Check, X } from 'lucide-react';
import { COMMAND_GROUPS, ALL_COMMANDS, TOTAL_COMMANDS, TOTAL_SLASH } from '../lib/commands';

export default function CommandExplorer() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [copied, setCopied] = useState(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_COMMANDS.filter((cmd) => {
      if (group !== 'all' && cmd.groupId !== group) return false;
      if (!q) return true;
      return cmd.name.toLowerCase().includes(q) || cmd.desc.toLowerCase().includes(q);
    });
  }, [query, group]);

  const copy = async (name) => {
    try {
      await navigator.clipboard.writeText('>' + name);
    } catch {
      /* clipboard blocked */
    }
    setCopied(name);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <section id="commands" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Terminal size={12} /> Command library
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold md:text-4xl">
            {TOTAL_COMMANDS} commands. Slash and prefix.
          </h2>
          <p className="mt-3 text-muted">
            Every command works as a <span className="font-mono text-white/80">/slash</span> command and with the{' '}
            <span className="font-mono text-white/80">&gt;prefix</span>. {TOTAL_SLASH} of them have slash variants,
            all {TOTAL_COMMANDS} run from chat and from the dashboard.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="card px-5 py-4 text-center">
            <div className="font-display text-2xl font-bold text-accent">{TOTAL_COMMANDS}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-muted">Total</div>
          </div>
          <div className="card px-5 py-4 text-center">
            <div className="font-display text-2xl font-bold text-accent">{TOTAL_SLASH}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-muted">Slash</div>
          </div>
          <div className="card px-5 py-4 text-center">
            <div className="font-display text-2xl font-bold text-accent">{COMMAND_GROUPS.length}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-muted">Categories</div>
          </div>
        </div>
      </div>

      {/* search */}
      <div className="relative mt-10">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${TOTAL_COMMANDS} commands...`}
          className="input pl-11 pr-11"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* category tabs */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setGroup('all')}
          className={
            'shrink-0 rounded-xl border px-3.5 py-2 text-sm transition ' +
            (group === 'all'
              ? 'border-accent/50 bg-accent/10 text-white'
              : 'border-edge text-muted hover:bg-white/5 hover:text-white')
          }
        >
          All ({TOTAL_COMMANDS})
        </button>
        {COMMAND_GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => setGroup(g.id)}
            className={
              'shrink-0 rounded-xl border px-3.5 py-2 text-sm transition ' +
              (group === g.id
                ? 'border-accent/50 bg-accent/10 text-white'
                : 'border-edge text-muted hover:bg-white/5 hover:text-white')
            }
          >
            {g.label} ({g.commands.length})
          </button>
        ))}
      </div>

      {/* results */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((cmd) => (
          <div key={cmd.groupId + cmd.name} className="card card-hover group p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-mono text-sm text-accent">&gt;{cmd.name}</span>
                {cmd.slash && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-edge px-1.5 py-0.5 font-mono text-[10px] text-muted">
                    <Zap size={9} />/{cmd.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => copy(cmd.name)}
                title="Copy prefix command"
                className="shrink-0 text-muted opacity-0 transition group-hover:opacity-100 hover:text-white"
              >
                {copied === cmd.name ? <Check size={13} className="text-emerald-400" /> : <Terminal size={13} />}
              </button>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{cmd.desc}</p>
            {cmd.usage && (
              <p className="mt-2 font-mono text-[11px] text-white/40">
                &gt;{cmd.name} {cmd.usage}
              </p>
            )}
            <div className="mt-3 text-[10px] uppercase tracking-wider text-white/30">{cmd.groupLabel}</div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="card mt-6 p-10 text-center">
          <p className="font-display text-lg">No command matches “{query}”</p>
          <p className="mt-1 text-sm text-muted">Try a shorter search or pick a category.</p>
        </div>
      )}
    </section>
  );
}
