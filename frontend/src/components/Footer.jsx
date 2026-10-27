import { Link } from 'react-router-dom';
import { Github, Youtube, Instagram, MessageCircle } from 'lucide-react';
import Logo from './Logo';
import { ADD_BOT_URL } from '../lib/bots';

const SUPPORT = 'https://discord.gg/nbc-prime-1256250708190036019';
const INVITE = ADD_BOT_URL;
const TUTORIAL = 'https://youtu.be/EuRhJxiWtks';

const cols = [
  { title: 'Product', links: [
    { label: 'Pricing', to: '/pricing' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Command List', to: '/dashboard/commands' },   // FIX: /#commands dead tha
    { label: 'Customization', to: '/dashboard/customization' },
    { label: 'Add to Discord', href: INVITE },
  ]},
  { title: 'Resources', links: [
    { label: 'FAQ', to: '/faq' },
    { label: 'Blogs', to: '/blogs' },
    { label: 'News', to: '/news' },
    { label: 'What Users Say', to: '/testimonials' },
    { label: 'Tutorial', href: TUTORIAL },
  ]},
  { title: 'Community', links: [
    { label: 'Support Server', href: SUPPORT },
    { label: 'Socials', to: '/socials' },
    { label: 'Bot Status', href: 'https://api-nbcprime.vercel.app/api/health' },
    { label: 'GitHub', href: 'https://github.com/mrrangerxd/nbcprime-web' },
  ]},
];

export default function Footer() {
  return (
    <footer className="border-t border-edge bg-panel/40">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              The deadliest Discord nuke and utility bot. Wipe, rebuild, and control any server from the web.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { icon: MessageCircle, href: SUPPORT, label: 'Discord' },
                { icon: Youtube, href: 'https://youtube.com/@zenseitech/videos', label: 'YouTube' },
                { icon: Instagram, href: 'https://www.instagram.com/zenseibabe', label: 'Instagram' },
                { icon: Github, href: 'https://github.com/mrrangerxd/nbcprime-web', label: 'GitHub' },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                   className="rounded-lg border border-edge p-2 text-muted transition hover:border-white/30 hover:text-white">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-sm font-semibold">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className="text-sm text-muted transition hover:text-white">{l.label}</Link>
                    ) : (
                      <a href={l.href} target="_blank" rel="noreferrer" className="text-sm text-muted transition hover:text-white">{l.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline mt-12 flex flex-col items-center justify-between gap-3 pt-6 text-xs text-dim sm:flex-row">
          <p>© {new Date().getFullYear()} NBCPrime. All rights reserved.</p>
          <p className="font-mono">Made by Zensei · Powered by Discord</p>
        </div>
      </div>
    </footer>
  );
}
