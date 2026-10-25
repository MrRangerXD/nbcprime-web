// EXACT mirror of bot help.py (Free + Premium). Antinuke wale fake commands hata diye.
export const COMMANDS = [
  // ---------- FREE ----------
  { name: '!nuke', tier: 'free', cat: 'Destruction', desc: 'Wipes all server channels and roles for a fresh start.', req: 'Administrator' },
  { name: '!backup', tier: 'free', cat: 'Management', desc: 'Creates a snapshot of the server configuration.' },
  { name: '!check_server', tier: 'free', cat: 'Info', desc: 'Displays current server security and status info.' },
  { name: '!rserver', tier: 'free', cat: 'Server', desc: 'Renames the server to the default name.' },
  { name: '!rservericon', tier: 'free', cat: 'Server', desc: 'Resets the server icon to default.' },
  { name: '!cchannels', tier: 'free', cat: 'Creation', desc: 'Creates a set of default channels.', args: '[count]' },
  { name: '!cthread', tier: 'free', cat: 'Creation', desc: 'Initializes new threads in every channel.', args: '[count]' },
  { name: '!croles', tier: 'free', cat: 'Creation', desc: 'Sets up default utility roles.', args: '[count]' },
  { name: '!cnsfw', tier: 'free', cat: 'Creation', desc: 'Quickly creates NSFW-tagged channels.', args: '[count]' },
  { name: '!spam', tier: 'free', cat: 'Messages', desc: 'Sends continuous messages to the current channel.', args: '[count]' },
  { name: '!mspam', tier: 'free', cat: 'Messages', desc: 'Multi-channel spamming for maximum reach.', args: '[count]' },
  { name: '!help', tier: 'free', cat: 'Bot', desc: 'Displays the main help menu.' },

  // ---------- PREMIUM ----------
  { name: '!banall', tier: 'vip', cat: 'Moderation', desc: 'Bans all members.' },
  { name: '!unbanall', tier: 'vip', cat: 'Moderation', desc: 'Unbans all members.' },
  { name: '!kickall', tier: 'vip', cat: 'Moderation', desc: 'Kicks all members.' },
  { name: '!timeoutall', tier: 'vip', cat: 'Moderation', desc: 'Timeouts all members.' },
  { name: '!untimeoutall', tier: 'vip', cat: 'Moderation', desc: 'Removes timeout from all members.' },
  { name: '!rnickall', tier: 'vip', cat: 'Moderation', desc: 'Renames nicknames of all members.' },
  { name: '!resetnickall', tier: 'vip', cat: 'Moderation', desc: 'Resets nicknames of all members.' },

  { name: '!dmall', tier: 'vip', cat: 'Mass Actions', desc: 'DMs all members in the server.' },
  { name: '!adminall', tier: 'vip', cat: 'Mass Actions', desc: 'Gives admin permissions to everyone.' },
  { name: '!demoteall', tier: 'vip', cat: 'Mass Actions', desc: 'Removes roles from all members.' },
  { name: '!moveall', tier: 'vip', cat: 'Mass Actions', desc: 'Moves all members to one voice channel.' },
  { name: '!disconnectall', tier: 'vip', cat: 'Mass Actions', desc: 'Disconnects all members from voice.' },

  { name: '!ccategory', tier: 'vip', cat: 'Channels', desc: 'Creates categories.', args: '[count]' },
  { name: '!dcategory', tier: 'vip', cat: 'Channels', desc: 'Deletes all categories.' },
  { name: '!rchannels', tier: 'vip', cat: 'Channels', desc: 'Renames all channels.' },
  { name: '!cvoice', tier: 'vip', cat: 'Channels', desc: 'Creates voice channels.', args: '[count]' },
  { name: '!rtopics', tier: 'vip', cat: 'Channels', desc: 'Changes topics of all channels.' },
  { name: '!slowmodeall', tier: 'vip', cat: 'Channels', desc: 'Sets slowmode on all channels.', args: '[seconds]' },
  { name: '!dchannels', tier: 'vip', cat: 'Channels', desc: 'Deletes every channel and drops one fresh one.' },

  { name: '!droles', tier: 'vip', cat: 'Roles', desc: 'Deletes all roles.' },
  { name: '!rroles', tier: 'vip', cat: 'Roles', desc: 'Renames all roles.' },
  { name: '!chaosroles', tier: 'vip', cat: 'Roles', desc: 'Randomises role positions.' },
  { name: '!chaosroleperms', tier: 'vip', cat: 'Roles', desc: 'Randomises role permissions.' },

  { name: '!cwebhooks', tier: 'vip', cat: 'Webhooks', desc: 'Creates mass webhooks.', args: '[count]' },
  { name: '!mwebhooks', tier: 'vip', cat: 'Webhooks', desc: 'Creates webhooks in every channel.', args: '[count]' },
  { name: '!dwebhooks', tier: 'vip', cat: 'Webhooks', desc: 'Deletes all webhooks.' },
  { name: '!rwebhooks', tier: 'vip', cat: 'Webhooks', desc: 'Renames all webhooks.' },

  { name: '!chaoschannels', tier: 'vip', cat: 'Advanced', desc: 'Randomises channel order.' },
  { name: '!chaoschannelperms', tier: 'vip', cat: 'Advanced', desc: 'Randomises channel permissions.' },
  { name: '!lockdown', tier: 'vip', cat: 'Advanced', desc: 'Locks all channels.' },
  { name: '!unlockall', tier: 'vip', cat: 'Advanced', desc: 'Unlocks all channels.' },
  { name: '!restore', tier: 'vip', cat: 'Advanced', desc: 'Restores server from a .nbc file.', req: 'Attach .nbc file' },

  { name: '!purge', tier: 'vip', cat: 'Cleaners', desc: 'Deletes all messages in the channel.' },
  { name: '!mpurge', tier: 'vip', cat: 'Cleaners', desc: 'Massive message deletion across channels.' },
  { name: '!rpins', tier: 'vip', cat: 'Cleaners', desc: 'Removes all pinned messages.' },
  { name: '!demojis', tier: 'vip', cat: 'Cleaners', desc: 'Deletes all server emojis.' },
  { name: '!dstickers', tier: 'vip', cat: 'Cleaners', desc: 'Deletes all server stickers.' },
  { name: '!dinvites', tier: 'vip', cat: 'Cleaners', desc: 'Deletes all invite links.' },
  { name: '!cinvites', tier: 'vip', cat: 'Cleaners', desc: 'Creates invites in every channel.', args: '[count]' },

  { name: '!nsfwall', tier: 'vip', cat: 'Server', desc: 'Sets all channels to NSFW mode.' },
];

export const CATEGORIES = [...new Set(COMMANDS.map((c) => c.cat))].sort();
export const FREE_COUNT = COMMANDS.filter((c) => c.tier === 'free').length;
export const VIP_COUNT = COMMANDS.filter((c) => c.tier === 'vip').length;
export const TOTAL_COMMANDS = COMMANDS.length;
export const MARQUEE_COMMANDS = COMMANDS.map((c) => c.name.replace('!', ''));