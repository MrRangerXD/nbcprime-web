import { Star, Quote } from 'lucide-react';
import { TESTIMONIALS } from '../lib/content';

export default function Testimonials({ limit }) {
  const list = limit ? TESTIMONIALS.slice(0, limit) : TESTIMONIALS;
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {list.map((t) => (
        <div key={t.name} className="card card-hover flex flex-col p-6">
          <Quote size={18} className="text-white/25" />
          <p className="mt-4 flex-1 text-[14px] leading-relaxed text-white/85">{t.text}</p>
          <div className="mt-5 flex items-center gap-3 border-t border-edge pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-surface font-display text-sm font-bold">
              {t.name[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{t.name}</p>
              <p className="truncate text-[11px] text-dim">{t.tag}</p>
            </div>
            <div className="ml-auto flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={11} className={i < t.rating ? 'fill-white text-white' : 'text-edge'} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
