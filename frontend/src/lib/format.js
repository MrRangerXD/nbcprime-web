export const nf = (n) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  const units = [[31536000, 'y'], [2592000, 'mo'], [86400, 'd'], [3600, 'h'], [60, 'm'], [1, 's']];
  for (const u of units) if (s >= u[0]) return Math.floor(s / u[0]) + u[1] + ' ago';
  return 'just now';
};

export const timeLeft = (d) => {
  const s = Math.floor((new Date(d) - Date.now()) / 1000);
  if (s <= 0) return 'ended';
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (days) return days + 'd ' + h + 'h';
  if (h) return h + 'h ' + m + 'm';
  return m + 'm';
};

export const avatarUrl = (id, hash) =>
  hash
    ? 'https://cdn.discordapp.com/avatars/' + id + '/' + hash + '.png?size=128'
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
