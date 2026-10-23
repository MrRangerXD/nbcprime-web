import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { avatarUrl } from '../lib/format';

const links = [
  { to: '/socials', label: 'Socials' },
  { to: '/blogs', label: 'Blogs' },
  { to: '/news', label: 'News' },
];

export default function Navbar() {
  const { user, login } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-edge/70 bg-void/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="NBCPrime" className="h-8 w-8 rounded-lg object-cover" />
          <span className="font-display text-lg font-bold tracking-tight">
            NBC<span className="text-accent">Prime</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                'rounded-lg px-3.5 py-2 text-sm transition-colors ' +
                (isActive ? 'text-white bg-white/5' : 'text-muted hover:text-white')
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link to="/dashboard" className="btn-ghost">
              <img src={avatarUrl(user.id, user.avatar)} alt="" className="h-5 w-5 rounded-full" />
              Dashboard
            </Link>
          ) : (
            <button onClick={login} className="btn-primary">
              <LogIn size={16} /> Sign in with Discord
            </button>
          )}
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-edge bg-panel px-5 py-4 md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2.5 text-sm text-muted">
              {l.label}
            </Link>
          ))}
          <div className="mt-3">
            {user ? (
              <Link to="/dashboard" className="btn-ghost w-full">Dashboard</Link>
            ) : (
              <button onClick={login} className="btn-primary w-full">Sign in with Discord</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
