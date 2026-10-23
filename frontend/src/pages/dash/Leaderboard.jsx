import { useEffect, useState } from 'react';
import { Server as ServerIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Badge, Avatar } from '../../components/ui';
import { nf } from '../../lib/format';

export default function Leaderboard({ scope }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    setRows(null);
    api.get('/api/leaderboard/' + scope + '?limit=50').then((d) => setRows(d.data)).catch(() => setRows([]));
  }, [scope]);

  const isUsers = scope === 'users';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{isUsers ? 'Top Users' : 'Top Servers'}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {isUsers ? 'Ranked by total commands used.' : 'Ranked by total commands used in that server.'}
        </p>
      </div>

      {rows === null ? <Loader /> : (
        <Card className="p-0 overflow-hidden">
          {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">No data recorded yet.</p>}
          {rows.map((r, i) => (
            <div key={r.id} className="flex items-center gap-4 border-b border-edge/60 p-4 last:border-0">
              <span className="font-display w-10 text-center text-lg font-bold text-muted">#{i + 1}</span>
              {isUsers ? (
                <Avatar src={r.avatar} alt={r.name} />
              ) : (
                <div className="h-9 w-9 overflow-hidden rounded-xl border border-edge bg-surface">
                  {r.icon
                    ? <img src={r.icon} alt="" className="h-full w-full object-cover" />
                    : <ServerIcon size={16} className="m-auto mt-2.5 text-muted" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.name}</p>
                {!isUsers && <p className="text-xs text-muted">{nf(r.member_count)} members - {r.id}</p>}
              </div>
              <Badge tone={i < 3 ? 'purple' : 'default'}>{nf(r.count)} cmds</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
