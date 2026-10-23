import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Server as ServerIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { Loader, Badge } from '../../components/ui';
import { nf } from '../../lib/format';

export default function Servers() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setRows(null);
    const t = setTimeout(() => {
      api.get('/api/guilds?q=' + encodeURIComponent(q) + '&page=' + page + '&limit=24')
        .then((d) => { setRows(d.data); setTotal(d.total); })
        .catch(() => setRows([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Servers</h1>
          <p className="mt-1.5 text-sm text-muted">{nf(total)} servers the bot is currently in.</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-3 text-muted" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search name or ID"
            className="input pl-9 w-72"
          />
        </div>
      </div>

      {rows === null ? <Loader /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((g) => (
              <Link key={g.guildId} to={'/dashboard/servers/' + g.guildId} className="card card-hover p-4 flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-edge bg-surface">
                  {g.icon
                    ? <img src={g.icon} alt="" className="h-full w-full object-cover" />
                    : <ServerIcon size={18} className="m-auto mt-3 text-muted" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{g.name}</p>
                  <p className="text-xs text-muted">{nf(g.memberCount)} members</p>
                </div>
                {g.isWhitelisted && <Badge tone="green">Protected</Badge>}
              </Link>
            ))}
          </div>
          {rows.length === 0 && <p className="text-center text-sm text-muted py-10">No servers match.</p>}

          <div className="flex items-center justify-center gap-3">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost">Previous</button>
            <span className="text-sm text-muted">Page {page}</span>
            <button disabled={page * 24 >= total} onClick={() => setPage((p) => p + 1)} className="btn-ghost">Next</button>
          </div>
        </>
      )}
    </div>
  );
}
