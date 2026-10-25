export const COMMANDS = [
  // ---------- Free ----------
  { name: '$nuke', tier: 'free', desc: 'Nuke the server (fast).', args: 'None', req: 'None' },
  { name: '$mass_ban', tier: 'free', desc: 'Ban all members.', req: 'Bot must have a higher role.' },
  { name: '$channel_spam', tier: 'free', desc: 'Spam 30 - 50 channels.' },
  { name: '$channel_rename', tier: 'free', desc: 'Rename all channels.' },
  { name: '$role_spam', tier: 'free', desc: 'Spam 50 roles.' },
  { name: '$role_delete', tier: 'free', desc: 'Delete all roles.' },
  { name: '$nsfw_all', tier: 'free', desc: 'Mark all channels as NSFW.' },
  { name: '$unnsfw_all', tier: 'free', desc: 'Remove NSFW flags from all channels.' },
  { name: '$webhooks', tier: 'free', desc: 'List all webhooks in the server.' },
  { name: '$spamwebhook', tier: 'free', desc: 'Spam all server webhooks.' },
  { name: '$emoji_spam', tier: 'free', desc: 'Spam 50 emojis.' },
  { name: '$emoji_delete', tier: 'free', desc: 'Delete all emoji.' },
  { name: '$create_sound', tier: 'free', desc: 'Create sound.' },
  { name: '$sticker_spam', tier: 'free', desc: 'Create 30 new stickers.' },
  { name: '$sticker_delete', tier: 'free', desc: 'Remove all stickers.' },
  { name: '$event_spam', tier: 'free', desc: 'Spam max 5 events.' },
  { name: '$event_delete', tier: 'free', desc: 'Delete all events.' },
  { name: '$perm', tier: 'free', desc: 'Create a role with the highest permissions.' },
  { name: '$fuck_chat', tier: 'free', desc: 'Block all words using automod.' },
  { name: '$server_lockdown', tier: 'free', desc: 'Lock all channels.' },
  { name: '$ping', tier: 'free', desc: 'Get bot ping.' },
  { name: '$stats', tier: 'free', desc: 'Show the number of servers nuked.' },
  { name: '$top', tier: 'free', desc: 'Top 10 raiders.' },

  // ---------- VIP ----------
  { name: '$nuke_pre', tier: 'vip', desc: 'Nuke the server with custom settings.', req: 'Custom message required.' },
  { name: '$channel_pre', tier: 'vip', desc: 'Create 30 - 50 channels with custom settings.' },
  { name: '$massban_pre', tier: 'vip', desc: 'Ban all members at ultra-high speed.' },
  { name: '$massban_bypass', tier: 'vip', desc: 'Bypass antinuke protections.' },
  { name: '$purge', tier: 'vip', desc: 'Purge members inactive for 1 day.' },
  { name: '$ban_booster', tier: 'vip', desc: 'Ban all server boosters.' },
  { name: '$mass_ping', tier: 'vip', desc: 'Ping all channels repeatedly.' },
  { name: '$role_pre', tier: 'vip', desc: 'Create roles with a custom name.', args: '[NAME]' },
  { name: '$nickall_pre', tier: 'vip', desc: 'Change the nickname of all users.', args: '[Nick]' },
  { name: '$perms_pre', tier: 'vip', desc: 'Create an admin-level role for you.' },
  { name: '$bypass_pre', tier: 'vip', desc: 'Bypass server security using custom settings.' },
  { name: '$check_config', tier: 'vip', desc: 'Check if a custom nuke config is set.' },
  { name: '$token_panel', tier: 'vip', desc: 'Paste a token to open the Account Control Panel.', args: '[TOKEN]' },
];

export const FREE_COUNT = COMMANDS.filter((c) => c.tier === 'free').length;
export const VIP_COUNT = COMMANDS.filter((c) => c.tier === 'vip').length;
