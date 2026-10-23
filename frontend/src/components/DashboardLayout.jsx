import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Trophy, Server, Gift, User as UserIcon, Shield, LogOut, Menu, X, BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { avatarUrl } from '../lib/format';
import { Badge } from './ui';

const nav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/top-users', label: 'Top Users', icon: Trophy },
  { to: '/dashboard/top-servers', label: 'Top Servers', icon: BarChart3 },
  { to: '/dashboard/servers', label: 'Servers', icon: Server },
  { to: '/dashboard/giveaways', label: 'Giveaways', icon: Gift },
  { to: '/dashboard/profile', label: 'Profile', icon: UserIcon },
  { to: '/dashboard/premium', label: 'Get Premium', icon: Sparkles }
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const items = [...nav];
  if (user && user.isAdmin) items.push({ to: '/dashboard/admin', label: 'Admin Panel', icon: Shield });

  return (
    <div className="min-h-screen lg:flex">
      <aside className={'fixed inset-y-0 z-40 w-64 border-r border-edge bg-panel/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ' + (open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-16 items-center justify-between px-5 border-b border-edge">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="font-display font-bold">NBC<span className="text-accent">Prime</span></span>
          </NavLink>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <nav className="p-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all border ' +
                (isActive
                  ? 'bg-white/10 text-white border-edge'
                  : 'text-muted hover:text-white hover:bg-white/5 border-transparent')
              }
            >
              <item.icon size={17} /> {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-edge p-3">
          <div className="flex items-center gap-3 rounded-xl bg-surface/60 p-3">
            <img src={avatarUrl(user.id, user.avatar)} alt="" className="h-9 w-9 rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.globalName || user.username}</p>
              <div className="mt-0.5 flex gap-1">
                {user.isOwner && <Badge tone="purple">Owner</Badge>}
                {user.isAdmin && !user.isOwner && <Badge tone="amber">Admin</Badge>}
                {user.isPremium && <Badge tone="green">Premium</Badge>}
              </div>
            </div>
            <button onClick={logout} title="Logout" className="text-muted hover:text-red-400">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-edge bg-void/80 px-5 backdrop-blur-xl lg:hidden">
          <button onClick={() => setOpen(true)}><Menu size={20} /></button>
          <span className="font-display font-semibold">Dashboard</span>
        </header>
        <main className="p-5 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
