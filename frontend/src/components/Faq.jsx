import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { FAQ } from '../lib/content';
import { Card } from './ui';

export default function Faq({ limit }) {
  const [open, setOpen] = useState(null);
  const list = limit ? FAQ.slice(0, limit) : FAQ;

  return (
    <section className="mx-auto max-w-4xl px-5 py-24">
      <div className="mb-10 text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">Support</p>
        <h2 className="font-display text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          Everything about the bot, premium and payments.
        </p>
      </div>

      <div className="space-y-2.5">
        {list.map((f, i) => (
          <Card key={f.q} className="p-0">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center gap-4 p-5 text-left"
            >
              <span className="mono shrink-0 text-xs text-dim">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-[15px] font-medium">{f.q}</span>
              <ChevronDown size={16} className={'shrink-0 text-muted transition ' + (open === i ? 'rotate-180' : '')} />
            </button>
            {open === i && (
              <p className="border-t border-edge px-5 py-4 pl-14 text-[14px] leading-relaxed text-muted">{f.a}</p>
            )}
          </Card>
        ))}
      </div>

      {limit && (
        <div className="mt-8 text-center">
          <Link to="/faq" className="btn-ghost">View all questions</Link>
        </div>
      )}
    </section>
  );
}