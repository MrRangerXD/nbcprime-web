import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Server, Users, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Empty, Badge } from '../../components/ui';
import { nf, shortId } from '../../lib/format';

export default function Servers() {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = (p = page) => {
    setLoading(true);
    api.get(`/api/guilds?page=${p}&limit=24${query ? `&q=${encodeURIComponent(query)}` : ''}`)
      .then((d) => { setGuilds(Array.isArray(d?.data) ? d.data : []); setTotal(d?.total || 0); })
      .catch(() => setGuilds([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); setPage(1); /* eslint-disable-next-line */ }, [query]);

  const pages = Math.max(1, Math.ceil(total / 24));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Servers</h1>
          <p className="mt-1 text-sm text-muted">{total} server(s) the bot is in.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
            <input className="input w-56 pl-10" placeholder="Search servers..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <button onClick={() => load()} className="btn-ghost"><RefreshCw size={14} /></button>
        </div>
      </div>

      {loading ? <Loader /> : guilds.length === 0 ? (
        <Empty title="No servers found" sub="Invite the bot to a server first." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guilds.map((g) => (
              <Link key={g.guildId} to={`/dashboard/servers/${g.guildId}`} className="card card-hover p-5">
                <div className="flex items-start gap-3">
                  {g.icon ? (
                    <img src={g.icon} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-edge bg-surface">
                      <Server size={17} className="text-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{g.name || 'Unknown'}</p>
                    <p className="mono text-[11px] text-dim">{shortId(g.guildId)}</p>
                  </div>
                  {g.isWhitelisted && <Badge tone="green">SAFE</Badge>}
                </div>

                <div className="mt-4 flex items-center gap-4 border-t border-edge pt-3 text-[11px] text-muted">
                  <span className="flex items-center gap-1.5"><Users size={11} /> {nf(g.memberCount)}</span>
                  <span>{nf(g.commandCount)} cmds</span>
                  {g.boostLevel > 0 && <span className="ml-auto">Lvl {g.boostLevel}</span>}
                </div>
              </Link>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p); }} disabled={page === 1} className="btn-ghost">Prev</button>
              <span className="mono text-xs text-muted">{page} / {pages}</span>
              <button onClick={() => { const p = Math.min(pages, page + 1); setPage(p); load(p); }} disabled={page === pages} className="btn-ghost">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}