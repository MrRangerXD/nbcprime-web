import { MessageCircle, Youtube, Instagram, Github, ExternalLink } from 'lucide-react';
import { SOCIALS } from '../lib/content';

const ICONS = { MessageCircle, Youtube, Instagram, Github };

export default function Socials() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="mb-10 text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">Community</p>
        <h1 className="font-display text-4xl font-bold">Find us everywhere</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Updates, tutorials and support — join the community.
        </p>
      </div>

      <div className="space-y-3">
        {SOCIALS.map((s) => {
          const Icon = ICONS[s.icon] || ExternalLink;
          return (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="card card-hover flex items-center gap-4 p-5"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-edge bg-surface">
                <Icon size={18} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.label}</p>
                <p className="truncate text-xs text-muted">{s.value}</p>
              </div>
              <ExternalLink size={15} className="shrink-0 text-dim" />
            </a>
          );
        })}
      </div>
    </div>
  );
}