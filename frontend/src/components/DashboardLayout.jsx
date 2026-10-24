import { NavLink, Link, Outlet } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Trophy, Server, Gift, User as UserIcon, Shield, LogOut,
  Menu, X, BarChart3, Sparkles, ChevronRight, Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { avatarUrl } from '../lib/format';
import { Badge } from './ui';
import Logo from './Logo';

const nav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/top-users', label: 'Top Users', icon: Trophy },
  { to: '/dashboard/top-servers', label: 'Top Servers', icon: BarChart3 },
  { to: '/dashboard/servers', label: 'Servers', icon: Server },
  { to: '/dashboard/giveaways', label: 'Giveaways', icon: Gift },
  { to: '/dashboard/premium', label: 'Get Premium', icon: Sparkles },
  { to: '/dashboard/profile', label: 'Profile', icon: UserIcon },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const items = [...nav];
  if (user?.isAdmin) items.push({ to: '/dashboard/admin', label: 'Admin Panel', icon: Shield });

  return (
    <div className="min-h-screen lg:flex">
      {open && <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={
        'fixed inset-y-0 z-40 flex w-64 flex-col border-r border-edge bg-panel/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ' +
        (open ? 'translate-x-0' : '-translate-x-full')
      }>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-edge px-5">
          <Link to="/"><Logo /></Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all ' +
                (isActive ? 'border-white/15 bg-white/10 text-white' : 'border-transparent text-muted hover:bg-white/5 hover:text-white')
              }
            >
              <item.icon size={17} /> {item.label}
              {item.to === '/dashboard/premium' && user && !user.isPremium && (
                <span className="ml-auto rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-black">NEW</span>
              )}
            </NavLink>
          ))}
          <div className="hairline my-2" />
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-white">
            <Home size={17} /> Back to site
          </Link>
        </nav>

        {user && !user.isPremium && (
          <Link to="/dashboard/premium" onClick={() => setOpen(false)}
                className="mx-3 mb-2 flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-medium transition hover:bg-white/10">
            <Sparkles size={14} /> Upgrade to Premium
            <ChevronRight size={14} className="ml-auto" />
          </Link>
        )}

        <div className="shrink-0 border-t border-edge p-3">
          <div className="flex items-center gap-3 rounded-xl bg-surface/60 p-3">
            <img src={avatarUrl(user?.id, user?.avatar)} alt="" className="h-9 w-9 rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.globalName || user?.username}</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {user?.isOwner && <Badge tone="solid">Owner</Badge>}
                {user?.isAdmin && !user?.isOwner && <Badge tone="amber">Admin</Badge>}
                {user?.isPremium && <Badge tone="green">Premium</Badge>}
              </div>
            </div>
            <button onClick={logout} title="Logout" className="text-muted hover:text-red-400"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-edge bg-void/85 px-5 backdrop-blur-xl lg:hidden">
          <button onClick={() => setOpen(true)}><Menu size={20} /></button>
          <span className="font-display font-semibold">Dashboard</span>
        </header>
        <main className="mx-auto max-w-7xl p-5 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
