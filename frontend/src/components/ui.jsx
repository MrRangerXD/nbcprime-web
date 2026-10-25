import { Link } from 'react-router-dom';

export const Card = ({ className = '', children, ...rest }) => (
  <div className={'card p-5 ' + className} {...rest}>{children}</div>
);

export const Stat = ({ label, value, icon: Icon, hint }) => (
  <div className="card card-hover p-5">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wider text-muted">{label}</span>
      {Icon && <Icon size={15} className="text-white/70" />}
    </div>
    <div className="mt-3 font-display text-3xl font-bold glow-text mono">{value}</div>
    {hint && <div className="mt-1 text-xs text-dim">{hint}</div>}
  </div>
);

export const Badge = ({ children, tone = 'default', className = '' }) => {
  const tones = {
    default: 'bg-white/5 text-white/70 border-edge',
    solid: 'bg-white text-black border-white',
    green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    red: 'bg-red-500/10 text-red-300 border-red-500/25',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    purple: 'bg-white/10 text-white/80 border-white/20',
  };
  return (
    <span className={'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ' +
      (tones[tone] || tones.default) + ' ' + className}>
      {children}
    </span>
  );
};

export const Loader = ({ label = 'Loading' }) => (
  <div className="flex items-center gap-3 py-10 text-sm text-muted justify-center">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-edge border-t-white" />
    {label}...
  </div>
);

export const Empty = ({ title, sub, action }) => (
  <div className="card p-10 text-center">
    <p className="font-display text-lg">{title}</p>
    {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Avatar = ({ src, alt, size = 36 }) => (
  <img
    src={src || 'https://cdn.discordapp.com/embed/avatars/0.png'}
    alt={alt}
    onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
    className="rounded-full border border-edge bg-surface object-cover"
    style={{ width: size, height: size }}
  />
);

export const Section = ({ eyebrow, title, sub, children, className = '' }) => (
  <section className={'mx-auto max-w-7xl px-5 py-16 lg:py-24 ' + className}>
    <div className="mb-10 max-w-2xl">
      {eyebrow && <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">{eyebrow}</p>}
      <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-[15px] leading-relaxed text-muted">{sub}</p>}
    </div>
    {children}
  </section>
);

export const Row = ({ children, className = '' }) => (
  <div className={'flex items-center justify-between gap-3 ' + className}>{children}</div>
);

export const Pill = ({ active, children, ...rest }) => (
  <button
    {...rest}
    className={
      'rounded-lg border px-3 py-1.5 text-xs font-semibold transition ' +
      (active ? 'border-white bg-white text-black' : 'border-edge text-muted hover:border-white/30 hover:text-white')
    }
  >
    {children}
  </button>
);

export const LinkBtn = ({ to, children, variant = 'ghost', className = '' }) => (
  <Link to={to} className={`btn-${variant} ${className}`}>{children}</Link>
);
