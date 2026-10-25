import { useEffect, useMemo, useState } from 'react';
import { Monitor, Eye, Save, RotateCcw, Loader2, Info, AlertTriangle, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Badge } from '../../components/ui';
import DiscordPreview from '../../components/DiscordPreview';

// backend/src/lib/nukeDefaults.js ke BOT_DEFAULTS se mirror — display placeholders only
const BOT_DEFAULTS = {
  serverName: '..<<𝙉𝙐𝙆𝙀 𝘽𝙔 𝙉𝘽𝘾>>...',
  customChannelName: '「🖤」custom-by-nbc',
  channelCount: 100,
  spamMessage: '💀 **NBC OWNS YOU** 💀',
  serverDescription: 'NBC Owns you!! '.repeat(7).trim(),
  serverIconUrl: 'https://i.imgur.com/DzPUKvD.jpeg',
};

// backend sanitizeOverrides() ke EXACT limits
const LIMITS = {
  serverName: 100,
  customChannelName: 100,
  channelCount: [1, 500],
  spamMessage: 2000,
  serverDescription: 190,
  serverIconUrl: 500,
};

const EMPTY = {
  serverName: '', customChannelName: '', channelCount: '',
  spamMessage: '', serverDescription: '', serverIconUrl: '',
};

const clampCount = (v) => {
  if (v === '' || v == null) return '';
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return '';
  const [min, max] = LIMITS.channelCount;
  return String(Math.min(max, Math.max(min, n)));
};

// backend asUrl() ke barabar — sirf http/https
const isUrl = (v) => {
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
};

export default function Customization() {
  const [config, setConfig] = useState(EMPTY);
  const [saved, setSaved] = useState(null);
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get('/api/me/nuke-config')
      .then((d) => {
        if (!alive) return;
        const c = { ...EMPTY, ...(d?.data?.config || {}) };
        setConfig(c);
        setSaved(c);
        setIsDefault(d?.data?.isDefault !== false);
      })
      .catch(() => { if (alive) setError('Could not load your config.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const dirty = useMemo(
    () => saved && JSON.stringify(config) !== JSON.stringify(saved),
    [config, saved]
  );

  const set = (key) => (e) => {
    const raw = e.target.value;
    setConfig((c) => ({ ...c, [key]: key === 'channelCount' ? clampCount(raw) : raw }));
    setSavedAt(0);
    setError('');
  };

  // backend pickOverrides() jaisa — khaali field bhejo to null ban ke default fire karta hai
  const payloadOf = (c) => ({
    serverName: c.serverName.trim(),
    customChannelName: c.customChannelName.trim(),
    channelCount: c.channelCount === '' ? '' : Number(c.channelCount),
    spamMessage: c.spamMessage.trim(),
    serverDescription: c.serverDescription.trim(),
    serverIconUrl: c.serverIconUrl.trim(),
  });

  const save = async () => {
    if (!isUrl(config.serverIconUrl)) {
      setError('Icon URL must start with http:// or https://');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const d = await api.patch('/api/me/nuke-config', payloadOf(config));
      const c = { ...EMPTY, ...(d?.data?.config || {}) };
      setConfig(c);
      setSaved(c);
      setIsDefault(false);
      setSavedAt(Date.now());
    } catch (e) {
      setError(e.message || 'Could not save.');
    } finally { setBusy(false); }
  };

  const reset = async () => {
    setBusy(true);
    setError('');
    try {
      await api.delete('/api/me/nuke-config');
      setConfig(EMPTY);
      setSaved(EMPTY);
      setIsDefault(true);
      setSavedAt(Date.now());
      setConfirmReset(false);
    } catch (e) {
      setError(e.message || 'Could not reset.');
    } finally { setBusy(false); }
  };

  if (loading) return <Loader label="Loading config" />;

  const field = 'w-full rounded-xl border border-edge bg-void px-4 py-3 text-sm outline-none transition focus:border-white/40';
  const lbl = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-muted';
  const hint = 'mt-1.5 text-[11px] text-dim';

  const preview = {
    serverName: config.serverName || BOT_DEFAULTS.serverName,
    channelName: config.customChannelName || BOT_DEFAULTS.customChannelName,
    channelCount: config.channelCount || BOT_DEFAULTS.channelCount,
    spamMessage: config.spamMessage || BOT_DEFAULTS.spamMessage,
    serverDescription: config.serverDescription || BOT_DEFAULTS.serverDescription,
  };

  const counter = (key) =>
    `${String(config[key] || '').length}/${LIMITS[key]}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Nuke Bot Config</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            Your custom values are <strong className="text-white/80">added</strong> on top of the
            defaults — every preset channel name and every built-in spam message still fires.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty && !savedAt && <Badge tone="amber">Unsaved changes</Badge>}
          {savedAt > 0 && <Badge tone="green"><Check size={11} className="mr-1" /> Saved</Badge>}
          <Badge tone={isDefault ? 'default' : 'solid'}>{isDefault ? 'Using Defaults' : 'Custom Config'}</Badge>
        </div>
      </div>

      <div className="flex gap-3 rounded-xl border border-edge bg-surface/40 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-white/60" />
        <p className="text-xs text-muted">
          Leave a field empty to use the bot default. Empty fields are stored as NULL, so the bot&apos;s
          own fallback always fires — even when you nuke without signing in.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-accent" />
            <h2 className="font-display font-semibold">Discord Server &amp; Nuke Engine Config</h2>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="flex items-baseline justify-between">
                <label className={lbl}>New Server Name</label>
                <span className="mono text-[10px] text-dim">{counter('serverName')}</span>
              </div>
              <input className={field} value={config.serverName} onChange={set('serverName')}
                maxLength={LIMITS.serverName} placeholder={BOT_DEFAULTS.serverName} />
            </div>

            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <div>
                <div className="flex items-baseline justify-between">
                  <label className={lbl}>Custom Channel Name</label>
                  <span className="mono text-[10px] text-dim">{counter('customChannelName')}</span>
                </div>
                <input className={field} value={config.customChannelName} onChange={set('customChannelName')}
                  maxLength={LIMITS.customChannelName} placeholder={BOT_DEFAULTS.customChannelName} />
                <p className={hint}>Added to the preset names, not a replacement.</p>
              </div>
              <div>
                <label className={lbl}>Channel Count</label>
                <input className={field} type="number" min={1} max={500}
                  value={config.channelCount} onChange={set('channelCount')}
                  placeholder={String(BOT_DEFAULTS.channelCount)} />
                <p className={hint}>1 – 500</p>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label className={lbl}>Custom Spam Message</label>
                <span className="mono text-[10px] text-dim">{counter('spamMessage')}</span>
              </div>
              <textarea className={field + ' min-h-[90px] resize-y'} value={config.spamMessage}
                onChange={set('spamMessage')} maxLength={LIMITS.spamMessage}
                placeholder={BOT_DEFAULTS.spamMessage} />
              <p className={hint}>The other 3 spam messages always fire too.</p>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label className={lbl}>Server Description</label>
                <span className="mono text-[10px] text-dim">{counter('serverDescription')}</span>
              </div>
              <textarea className={field + ' min-h-[70px] resize-y'} value={config.serverDescription}
                onChange={set('serverDescription')} maxLength={LIMITS.serverDescription}
                placeholder={BOT_DEFAULTS.serverDescription} />
              <p className={hint}>Max {LIMITS.serverDescription} characters.</p>
            </div>

            <div>
              <label className={lbl}>Server Icon URL</label>
              <input className={field + (isUrl(config.serverIconUrl) ? '' : ' border-red-500/50')}
                value={config.serverIconUrl} onChange={set('serverIconUrl')}
                maxLength={LIMITS.serverIconUrl} placeholder={BOT_DEFAULTS.serverIconUrl} />
              {!isUrl(config.serverIconUrl) && (
                <p className="mt-1.5 text-[11px] text-red-300">Must start with http:// or https://</p>
              )}
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={save} disabled={busy || !dirty} className="btn-primary flex-1 py-3">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Config
            </button>

            {confirmReset ? (
              <>
                <button onClick={reset} disabled={busy} className="btn-danger py-3">
                  <AlertTriangle size={15} /> Confirm reset
                </button>
                <button onClick={() => setConfirmReset(false)} className="btn-ghost py-3">Cancel</button>
              </>
            ) : (
              <button onClick={() => setConfirmReset(true)} disabled={busy || isDefault} className="btn-ghost py-3">
                <RotateCcw size={15} /> Reset to Default
              </button>
            )}
          </div>
        </Card>

        <Card className="h-fit lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-accent" />
              <h2 className="font-display font-semibold">Discord Live Preview</h2>
            </div>
            <Badge tone="green">Realtime</Badge>
          </div>
          <div className="mt-4"><DiscordPreview config={preview} /></div>
        </Card>
      </div>
    </div>
  );
}