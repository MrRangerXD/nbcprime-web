const socials = [
  { name: 'Discord', handle: 'NBC Prime', url: 'https://discord.gg/nbc-prime-1256250708190036019', color: '#5865F2' },
  { name: 'YouTube', handle: '@zenseitech', url: 'https://youtube.com/@zenseitech/videos', color: '#FF0000' },
  { name: 'Instagram', handle: '@zenseibabe', url: 'https://www.instagram.com/zenseibabe', color: '#E1306C' },
];

export default function Socials() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="font-display text-4xl font-bold glow-text">Socials</h1>
      <p className="mt-3 text-muted">Follow the chaos.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {socials.map((s) => (
          <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="card card-hover p-6">
            <div className="h-10 w-10 rounded-xl" style={{ background: s.color + '22', border: '1px solid ' + s.color + '55' }} />
            <h3 className="mt-4 font-display font-semibold">{s.name}</h3>
            <p className="text-sm text-muted">{s.handle}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
