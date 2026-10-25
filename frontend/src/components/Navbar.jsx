import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { avatarUrl } from '../lib/format';
import Logo from './Logo';
import { Badge } from './ui';
import { useState } from 'react';
import InviteBotModal from './InviteBotModal';

const links = [
  { to: '/', label: 'Home' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/testimonials', label: 'What Users Say' },
  { to: '/blogs', label: 'Blogs' },
  { to: '/news', label: 'News' },
  { to: '/faq', label: 'FAQ' },
];

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={
      'sticky top-0 z-50 border-b transition-colors ' +
      (scrolled ? 'border-edge bg-void/85 backdrop-blur-xl' : 'border-transparent')
    }>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5">
        <Link to="/"><Logo /></Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                'rounded-lg px-3 py-2 text-sm transition ' +
                (isActive ? 'text-white' : 'text-muted hover:text-white')
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to="/dashboard" className="btn-ghost">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface/60 px-2.5 py-1.5">
                <img src={avatarUrl(user.id, user.avatar)} alt="" className="h-6 w-6 rounded-full" />
                <span className="max-w-[110px] truncate text-xs">{user.globalName || user.username}</span>
                {user.isPremium && <Badge tone="solid">PRO</Badge>}
                <button onClick={logout} title="Logout" className="text-muted hover:text-red-400"><LogOut size={14} /></button>
              </div>
            </>
          ) : (
            <>
              <Link to="/pricing" className="btn-ghost">Pricing</Link>
              <button onClick={login} className="btn-primary">Sign in with Discord</button>
            </>
          )}
        </div>

        <button className="ml-auto lg:hidden" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-edge bg-void/95 backdrop-blur-xl lg:hidden">
          <div className="space-y-1 p-4">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="block rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-white">
                {l.label}
              </Link>
            ))}
            <div className="hairline my-3" />
            {user ? (
              <>
                <Link to="/dashboard" className="btn-primary w-full">Dashboard</Link>
                <button onClick={logout} className="btn-ghost mt-2 w-full">Logout</button>
              </>
            ) : (
              <button onClick={login} className="btn-primary w-full">
                <Sparkles size={15} /> Sign in with Discord
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
