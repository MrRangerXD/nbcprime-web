export const MIN_MEMBERS = 20;

export const BOTS = [
  {
    id: 'nuke',
    name: 'NBCPrime',
    description: 'Main nuke + utility bot. Required for every dashboard action.',
    clientId: '1563885964567257128',
  },
  {
    id: 'backup',
    name: 'NBC Backup',
    description: 'Backup & restore bot. Optional but recommended for large servers.',
    clientId: '1455472629912965211',
  },
];

export const inviteUrl = (bot) =>
  `https://discord.com/oauth2/authorize?client_id=${bot.clientId}` +
  '&permissions=8&integration_type=0&scope=bot+applications.commands';