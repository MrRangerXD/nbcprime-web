import { MARQUEE_COMMANDS, TOTAL_COMMANDS, TOTAL_SLASH } from '../lib/commands';
// Bot ke actual command set ka mirror — CommandExplorer isko use karta hai.
export const COMMANDS = [
  // Free
  { name: 'nuke', cat: 'Destruction', tier: 'free', desc: 'Full server wipe + rebuild with your branding.' },
  { name: 'backup', cat: 'Management', tier: 'free', desc: 'Snapshot channels, roles and permissions into a .nbc file.' },
  { name: 'restore', cat: 'Management', tier: 'free', desc: 'Rebuild a server from a .nbc backup file.' },
  { name: 'check_server', cat: 'Info', tier: 'free', desc: 'Show connection and security status.' },
  { name: 'rserver', cat: 'Branding', tier: 'free', desc: 'Rename the server to the NBC default.' },
  { name: 'rservericon', cat: 'Branding', tier: 'free', desc: 'Reset the server icon.' },
  { name: 'cchannels', cat: 'Create', tier: 'free', desc: 'Create the default channel set.' },
  { name: 'cthread', cat: 'Create', tier: 'free', desc: 'Spawn threads in channels.' },
  { name: 'croles', cat: 'Create', tier: 'free', desc: 'Create default roles.' },
  { name: 'cnsfw', cat: 'Create', tier: 'free', desc: 'Create NSFW-tagged channels.' },
  { name: 'spam', cat: 'Messages', tier: 'free', desc: 'Spam the current channel.' },
  { name: 'mspam', cat: 'Messages', tier: 'free', desc: 'Spam every text channel.' },
  { name: 'ping', cat: 'Info', tier: 'free', desc: 'Gateway latency.' },
  { name: 'help', cat: 'Info', tier: 'free', desc: 'Interactive help menu.' },

  // Premium
  { name: 'banall', cat: 'Moderation', tier: 'premium', desc: 'Ban every member.' },
  { name: 'unbanall', cat: 'Moderation', tier: 'premium', desc: 'Unban everyone.' },
  { name: 'kickall', cat: 'Moderation', tier: 'premium', desc: 'Kick every member.' },
  { name: 'timeoutall', cat: 'Moderation', tier: 'premium', desc: 'Timeout the whole server.' },
  { name: 'untimeoutall', cat: 'Moderation', tier: 'premium', desc: 'Remove all timeouts.' },
  { name: 'rnickall', cat: 'Moderation', tier: 'premium', desc: 'Rename every member.' },
  { name: 'resetnickall', cat: 'Moderation', tier: 'premium', desc: 'Reset every nickname.' },
  { name: 'dmall', cat: 'Mass', tier: 'premium', desc: 'DM every member.' },
  { name: 'adminall', cat: 'Mass', tier: 'premium', desc: 'Give everyone admin.' },
  { name: 'demoteall', cat: 'Mass', tier: 'premium', desc: 'Strip all roles.' },
  { name: 'moveall', cat: 'Mass', tier: 'premium', desc: 'Move everyone to one voice channel.' },
  { name: 'disconnectall', cat: 'Mass', tier: 'premium', desc: 'Disconnect everyone from voice.' },
  { name: 'ccategory', cat: 'Channels', tier: 'premium', desc: 'Create categories.' },
  { name: 'dcategory', cat: 'Channels', tier: 'premium', desc: 'Delete all categories.' },
  { name: 'rchannels', cat: 'Channels', tier: 'premium', desc: 'Rename every channel.' },
  { name: 'rtopics', cat: 'Channels', tier: 'premium', desc: 'Randomise channel topics.' },
  { name: 'slowmodeall', cat: 'Channels', tier: 'premium', desc: 'Set slowmode everywhere.' },
  { name: 'droles', cat: 'Roles', tier: 'premium', desc: 'Delete all roles.' },
  { name: 'rroles', cat: 'Roles', tier: 'premium', desc: 'Rename all roles.' },
  { name: 'chaosroles', cat: 'Chaos', tier: 'premium', desc: 'Shuffle role positions.' },
  { name: 'chaosroleperms', cat: 'Chaos', tier: 'premium', desc: 'Randomise role permissions.' },
  { name: 'chaoschannels', cat: 'Chaos', tier: 'premium', desc: 'Shuffle channel order.' },
  { name: 'chaoschannelperms', cat: 'Chaos', tier: 'premium', desc: 'Randomise channel permissions.' },
  { name: 'lockdown', cat: 'Control', tier: 'premium', desc: 'Lock every channel.' },
  { name: 'unlockall', cat: 'Control', tier: 'premium', desc: 'Unlock every channel.' },
  { name: 'cwebhooks', cat: 'Webhooks', tier: 'premium', desc: 'Create mass webhooks.' },
  { name: 'dwebhooks', cat: 'Webhooks', tier: 'premium', desc: 'Delete all webhooks.' },
  { name: 'rwebhooks', cat: 'Webhooks', tier: 'premium', desc: 'Rename all webhooks.' },
  { name: 'purge', cat: 'Cleaners', tier: 'premium', desc: 'Clear a channel.' },
  { name: 'mpurge', cat: 'Cleaners', tier: 'premium', desc: 'Clear every channel.' },
  { name: 'rpins', cat: 'Cleaners', tier: 'premium', desc: 'Unpin everything.' },
  { name: 'demojis', cat: 'Cleaners', tier: 'premium', desc: 'Delete all emojis.' },
  { name: 'dstickers', cat: 'Cleaners', tier: 'premium', desc: 'Delete all stickers.' },
  { name: 'dinvites', cat: 'Cleaners', tier: 'premium', desc: 'Delete all invites.' },
  { name: 'nsfwall', cat: 'Cleaners', tier: 'premium', desc: 'Mark every channel NSFW.' },
  { name: 'backup', cat: 'Management', tier: 'premium', desc: 'Full permission-aware backup.' },
];

export const CATEGORIES = [...new Set(COMMANDS.map((c) => c.cat))];
export const TOTAL_COMMANDS = COMMANDS.length;
export const TOTAL_SLASH = COMMANDS.length; // or your real slash-variant count
export const MARQUEE_COMMANDS = COMMANDS.slice(0, 20).map((c) => c.name);
