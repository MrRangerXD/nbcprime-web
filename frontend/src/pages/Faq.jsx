import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { FAQ } from '../lib/content';
import { Card } from '../components/ui';

export default function Faq() {
  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');

  const cats = useMemo(() => ['All', ...new Set(FAQ.map((f) => f.cat))], []);
  const list = FAQ.filter(
    (f) =>
      (cat === 'All' || f.cat === cat) &&
      (!query ||
        f.q.toLowerCase().includes(query.toLowerCase()) ||
        f.a.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <div className="mb-10 text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">Support</p>
        <h1 className="font-display text-4xl font-bold">Frequently asked questions</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          Everything about the bot, premium and payments. Still stuck? Ping us in the support server.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
          <input
            className="input pl-10"
            placeholder="Search questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => { setCat(c); setOpen(null); }}
              className={
                'shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ' +
                (cat === c ? 'border-white bg-white text-black' : 'border-edge text-muted hover:text-white')
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {list.map((f, i) => (
          <Card key={f.q} className="p-0">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-4 p-5 text-left">
              <span className="mono shrink-0 text-xs text-dim">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-[15px] font-medium">{f.q}</span>
              <ChevronDown size={16} className={'shrink-0 text-muted transition ' + (open === i ? 'rotate-180' : '')} />
            </button>
            {open === i && (
              <p className="border-t border-edge px-5 py-4 pl-14 text-[14px] leading-relaxed text-muted">{f.a}</p>
            )}
          </Card>
        ))}
        {!list.length && <p className="py-10 text-center text-sm text-dim">No matching questions.</p>}
      </div>
    </div>
  );
}