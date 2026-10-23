import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-edge mt-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-7 w-7 rounded-lg" />
            <span className="font-display font-bold">NBCPrime</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted">
            The nuke bot that never loses. Remote execution, live stats and a public leaderboard.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted">Site</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/blogs" className="hover:text-accent">Blogs</Link></li>
            <li><Link to="/news" className="hover:text-accent">News</Link></li>
            <li><Link to="/socials" className="hover:text-accent">Socials</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted">Community</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="https://discord.gg/nbc-prime-1256250708190036019" target="_blank" rel="noreferrer" className="hover:text-accent">Discord</a></li>
            <li><a href="https://youtube.com/@zenseitech/videos" target="_blank" rel="noreferrer" className="hover:text-accent">YouTube</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-edge py-5 text-center text-xs text-muted">
        NBCPrime. Built by Zensei.
      </div>
    </footer>
  );
}
