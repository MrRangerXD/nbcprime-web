export default function Logo({ size = 30, withText = true, className = '' }) {
  return (
    <span className={'flex items-center gap-2.5 ' + className}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#000" stroke="#262626" />
        <path d="M17 46V18h6l11 16V18h6v28h-6L23 30v16z" fill="#fff" />
      </svg>
      {withText && (
        <span className="font-display text-[17px] font-bold tracking-tight">
          NBC<span className="text-muted">Prime</span>
        </span>
      )}
    </span>
  );
}
