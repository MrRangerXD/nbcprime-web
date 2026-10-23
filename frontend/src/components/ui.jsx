export const Card = ({ className = '', children, ...rest }) => (
  <div className={'card p-5 ' + className} {...rest}>{children}</div>
);

export const Stat = ({ label, value, icon: Icon, hint }) => (
  <div className="card card-hover p-5">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wider text-muted">{label}</span>
      {Icon && <Icon size={16} className="text-accent" />}
    </div>
    <div className="mt-3 font-display text-3xl font-bold glow-text">{value}</div>
    {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
  </div>
);

export const Badge = ({ children, tone = 'default' }) => {
  const tones = {
    default: 'bg-white/5 text-white/70 border-edge',
    green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    red: 'bg-red-500/10 text-red-300 border-red-500/30',
    purple: 'bg-accent/10 text-accent border-accent/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  };
  return (
    <span className={'inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium ' + tones[tone]}>
      {children}
    </span>
  );
};

export const Loader = ({ label = 'Loading' }) => (
  <div className="flex items-center gap-3 text-muted text-sm py-10 justify-center">
    <span className="h-4 w-4 rounded-full border-2 border-edge border-t-accent animate-spin" />
    {label}...
  </div>
);

export const Empty = ({ title, sub }) => (
  <div className="card p-10 text-center">
    <p className="font-display text-lg">{title}</p>
    {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
  </div>
);

export const Avatar = ({ src, alt, size = 36 }) => (
  <img
    src={src}
    alt={alt}
    className="rounded-full border border-edge object-cover bg-surface"
    style={{ width: size, height: size }}
  />
);
