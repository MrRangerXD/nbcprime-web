import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut, Sparkles, Bot, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { avatarUrl } from '../lib/format';
import Logo from './Logo';
import { Badge } from './ui';
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
  const [invite, setInvite] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // mobile menu khula ho to background scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header
        className={
          'sticky top-0 z-50 border-b transition-all duration-300 ' +
          (scrolled || open
            ? 'border-edge bg-void/85 backdrop-blur-xl'
            : 'border-transparent bg-transparent')
        }
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5">
          <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
            <Logo />
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  'relative rounded-lg px-3 py-2 text-sm transition ' +
                  (isActive ? 'text-white' : 'text-muted hover:text-white')
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-px h-px bg-white/60" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* desktop actions */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <button onClick={() => setInvite(true)} className="btn-ghost">
              <Bot size={15} /> Invite bot
            </button>

            {user ? (
              <>
                <Link to="/dashboard" className="btn-primary">
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface/60 px-2.5 py-1.5">
                  <img src={avatarUrl(user.id, user.avatar)} alt="" className="h-6 w-6 rounded-full" />
                  <span className="max-w-[110px] truncate text-xs">
                    {user.globalName || user.username}
                  </span>
                  {user.isPremium && <Badge tone="solid">PRO</Badge>}
                  <button onClick={logout} title="Logout" className="text-muted hover:text-red-400">
                    <LogOut size={14} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/pricing" className="btn-ghost">Pricing</Link>
                <button onClick={login} className="btn-primary">Sign in with Discord</button>
              </>
            )}
          </div>

          {/* mobile toggle */}
          <button
            className="ml-auto rounded-lg border border-edge p-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* mobile menu */}
        {open && (
          <div className="border-t border-edge bg-void/95 backdrop-blur-xl lg:hidden">
            <div className="space-y-1 p-4">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    'block rounded-lg px-3 py-2.5 text-sm transition ' +
                    (isActive ? 'bg-white/10 text-white' : 'text-muted hover:bg-white/5 hover:text-white')
                  }
                >
                  {l.label}
                </NavLink>
              ))}

              <div className="hairline my-3" />

              <button
                onClick={() => { setInvite(true); setOpen(false); }}
                className="btn-ghost w-full"
              >
                <Bot size={15} /> Invite bot
              </button>

              {user ? (
                <>
                  <Link to="/dashboard" className="btn-primary mt-2 w-full">
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-edge bg-surface/60 p-3">
                    <img src={avatarUrl(user.id, user.avatar)} alt="" className="h-8 w-8 rounded-full" />
                    <span className="min-w-0 flex-1 truncate text-sm">{user.globalName || user.username}</span>
                    {user.isPremium && <Badge tone="solid">PRO</Badge>}
                    <button onClick={logout} className="text-muted hover:text-red-400">
                      <LogOut size={15} />
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={login} className="btn-primary mt-2 w-full">
                  <Sparkles size={15} /> Sign in with Discord
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* FIX: modal ab header ke BAHAR hai — pehle {open && ...} ke andar tha
          isliye sirf mobile menu khulne par hi mount hota tha */}
      <InviteBotModal open={invite} onClose={() => setInvite(false)} />
    </>
  );
}