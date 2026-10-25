// Replace clientId with your actual application ID from the Discord Developer Portal.
export const BOTS = [
  {
    id: 'nuke',
    name: 'Nuke Bot',
    description: 'Full suite of nuke, spam, and bypass commands',
    clientId: '1492941499099516998',
    permissions: '8',
  },
  {
    id: 'raider',
    name: 'Raider Bot',
    description: 'Optimized for fast raids, auto join',
    clientId: '1492941499099516998',
    permissions: '8',
  },
];

export const MIN_MEMBERS = 10;

export const inviteUrl = (bot) =>
  `https://discord.com/oauth2/authorize?client_id=${bot.clientId}` +
  `&scope=bot%20applications.commands&permissions=${bot.permissions}`;
