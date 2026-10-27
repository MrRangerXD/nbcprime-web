export const MIN_MEMBERS = 20;

// 1560240009678684232 = NUKE bot (invite).
// 1563885964567257128 = login/verification OAuth app — sirf "Sign in with Discord" ke liye.
export const NUKE_CLIENT_ID = '1560240009678684232';

export const BOTS = [
  {
    id: 'nuke',
    name: 'NBCPrime',
    description: 'Main nuke + utility bot. Required for every dashboard action.',
    clientId: NUKE_CLIENT_ID,
  },
  {
    id: 'backup',
    name: 'NBC Backup',
    description: 'Same bot, backup & restore side. Optional but recommended.',
    clientId: NUKE_CLIENT_ID,
  },
];

export const inviteUrl = (bot) =>
  `https://discord.com/oauth2/authorize?client_id=${bot.clientId}` +
  '&permissions=8&integration_type=0&scope=bot+applications.commands';

// Footer.jsx, Home.jsx, PricingSection.jsx isko import karte hain — iske bina build fail
export const ADD_BOT_URL = inviteUrl(BOTS[0]);
