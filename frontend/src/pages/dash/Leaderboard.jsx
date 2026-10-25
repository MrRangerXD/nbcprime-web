import { useEffect, useState } from 'react';
import { Trophy, BarChart3, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Avatar, Badge, Loader, Empty } from '../../components/ui';
import { nf } from '../../lib/format';

const MEDALS = ['text-amber-300', 'text-white/80', 'text-amber-600'];

export default function Leaderboard({ scope = 'users' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/api/leaderboard/${scope}?limit=50`)
      .then((d) => { setRows(Array.isArray(d?.data) ? d.data : []); setSource(d?.source || ''); })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [scope]);

  const isUsers = scope === 'users';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {isUsers ? <Trophy size={22} /> : <BarChart3 size={22} />}
          <div>
            <h1 className="font-display text-3xl font-bold">{isUsers ? 'Top Users' : 'Top Servers'}</h1>
            <p className="mt-1 text-sm text-muted">
              {isUsers ? 'Ranked by commands run.' : 'Ranked by commands used in the server.'}
              {source === 'db' && ' (cached — bot offline)'}
            </p>
          </div>
        </div>
        <button onClick={load} className="btn-ghost"><RefreshCw size={14} /> Refresh</button>
      </div>

      {loading ? <Loader /> : rows.length === 0 ? (
        <Empty title="No data yet" sub="Run a command to get on the board." />
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-edge">
            {rows.map((r, i) => (
              <div key={r.id || i} className="flex items-center gap-4 p-4">
                <span className={'w-8 shrink-0 font-display text-lg font-bold ' + (MEDALS[i] || 'text-muted')}>
                  #{i + 1}
                </span>
                {isUsers ? (
                  <Avatar src={r.avatar} alt={r.name} />
                ) : (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-edge bg-surface text-xs font-bold">
                    {(r.name || '?')[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name || 'Unknown'}</p>
                  {!isUsers && r.member_count != null && (
                    <p className="text-[11px] text-dim">{nf(r.member_count)} members</p>
                  )}
                </div>
                <Badge>{nf(r.count)} cmds</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}