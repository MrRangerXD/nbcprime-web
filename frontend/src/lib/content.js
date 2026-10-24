export const FAQ = [
  { cat: 'General', q: 'What is NBCPrime?', a: 'NBCPrime is a Discord nuke + utility bot. It wipes a server down to nothing and rebuilds it in seconds, plus backups, mass actions, webhooks, giveaways and a full web dashboard.' },
  { cat: 'General', q: 'Is it free?', a: 'Yes. Core nuke, backup, restore and info commands are free forever. Premium unlocks the heavy mass-action commands.' },
  { cat: 'General', q: 'Which servers can it work in?', a: 'Any server where the bot has Administrator. Some servers can be whitelisted so they are protected from nukes.' },
  { cat: 'Premium', q: 'What do I get with Premium?', a: 'banall, kickall, dmall, droles, chaos commands, lockdown, purge-all, mass webhooks and more — plus priority support.' },
  { cat: 'Premium', q: 'How do I pay?', a: 'Open the Premium page, pick a plan and currency (LTC or SOL), send the exact amount to the shown address. The site watches the blockchain and unlocks you automatically after 1 confirmation.' },
  { cat: 'Premium', q: 'I paid but it is still pending.', a: 'Hit the Verify button — it re-scans the chain. If it still does not unlock after a few minutes, open a ticket in the support server with your txid.' },
  { cat: 'Premium', q: 'Do you offer refunds?', a: 'Crypto is irreversible, so no automatic refunds. If a payment was credited to the wrong account we fix it manually.' },
  { cat: 'Premium', q: 'Is Premium per server or per user?', a: 'Per Discord account. Once you are premium, you can use premium commands in any server where the bot is.' },
  { cat: 'Technical', q: 'The bot is not responding.', a: 'Make sure it has Administrator and that slash commands are synced. If a server is whitelisted, its commands are intentionally blocked.' },
  { cat: 'Technical', q: 'What is a whitelisted server?', a: 'A protected server. Nuke commands will not fire there unless you force it, so your main server stays safe.' },
  { cat: 'Technical', q: 'Do you store my Discord data?', a: 'Only public profile info (id, username, avatar) plus command counts. OAuth tokens are AES-256-GCM encrypted in the database.' },
  { cat: 'Technical', q: 'Can I self-host?', a: 'The bot yes. The site is open code too — fork the repo, set your own env vars and deploy.' },
];

export const TESTIMONIALS = [
  { name: 'Aarav', tag: 'Server Owner · 42k members', text: 'Nuked a 40k member server in about 90 seconds and rebuilt it with 100 channels. Nothing else came close.', rating: 5 },
  { name: 'Zenith', tag: 'Community Manager', text: 'The web dashboard is what sold me. I can nuke or lockdown from my phone without touching Discord.', rating: 5 },
  { name: 'Kira', tag: 'Bot Developer', text: 'Premium is dirt cheap for what it does. banall + dmall alone saved me hours of scripting.', rating: 5 },
  { name: 'Rohan', tag: 'Server Admin', text: 'Backup and restore actually works with permissions. We restored a full layout after a bad nuke.', rating: 5 },
  { name: 'Meera', tag: 'Event Host', text: 'Giveaways from the panel, auto winners, no setup. Clean.', rating: 4 },
  { name: 'Dev', tag: 'Discord Veteran', text: 'Support answered in 10 minutes when my LTC payment was pending. Verify button sorted it.', rating: 5 },
];

export const FEATURES = [
  { title: 'Instant Nuke', text: 'Wipe channels, roles, emojis and stickers, then rebuild the whole server with your branding in seconds.', icon: 'Zap' },
  { title: 'Backup & Restore', text: 'Snapshot a full server layout with permissions, then restore it exactly — .nbc files.', icon: 'Archive' },
  { title: 'Mass Actions', text: 'banall, kickall, dmall, rnickall, adminall, demoteall — one command, whole server.', icon: 'Users' },
  { title: 'Chaos Engine', text: 'Randomise channels, roles and permissions to break any boring layout.', icon: 'Shuffle' },
  { title: 'Web Dashboard', text: 'Control every server from the browser. Live logs, leaderboards, one-click actions.', icon: 'LayoutDashboard' },
  { title: 'Anti-Nuke Guard', text: 'Whitelist important servers so they survive your nuke sprees.', icon: 'ShieldCheck' },
];
