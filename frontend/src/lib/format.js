export const nf = (n) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n) || 0);

export const full = (n) => new Intl.NumberFormat('en').format(Number(n) || 0);

export const timeAgo = (d) => {
  if (!d) return 'just now';
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return 'just now';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 5) return 'just now';
  for (const [u, l] of [[31536000, 'y'], [2592000, 'mo'], [86400, 'd'], [3600, 'h'], [60, 'm'], [1, 's']]) {
    if (s >= u) return Math.floor(s / u) + l + ' ago';
  }
  return 'just now';
};

export const timeLeft = (d) => {
  if (!d) return 'ended';
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return 'ended';
  const s = Math.floor((t - Date.now()) / 1000);
  if (s <= 0) return 'ended';
  const d2 = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d2) return d2 + 'd ' + h + 'h';
  if (h) return h + 'h ' + m + 'm';
  return m + 'm ' + (s % 60) + 's';
};

export const avatarUrl = (id, hash) =>
  id && hash
    ? `https://cdn.discordapp.com/avatars/${id}/${hash}.png?size=128`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

export const guildIcon = (id, hash) =>
  id && hash ? `https://cdn.discordapp.com/icons/${id}/${hash}.png?size=128` : null;

export const shortId = (id) => (id ? String(id).slice(-6) : '------');