import { useEffect, useState } from 'react';
import { Monitor, Eye, Save, RotateCcw, Loader2, Info } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Loader, Badge } from '../../components/ui';
import DiscordPreview from '../../components/DiscordPreview';

const EMPTY = {
  serverName: '', customChannelName: '', channelCount: '',
  spamMessage: '', serverDescription: '', serverIconUrl: '',
};

export default function Customization() {
  const [config, setConfig] = useState(EMPTY);
  const [defaults, setDefaults] = useState(EMPTY);
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.get('/api/me/nuke-config')
      .then((d) => {
        if (!alive) return;
        setConfig({ ...EMPTY, ...d.data.config });
        setDefaults(d.data.defaults);
        setIsDefault(d.data.isDefault);
      })
      .catch(() => alive && setError('Could not load your config.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const set = (key) => (e) => {
    setConfig((c) => ({ ...c, [key]: e.target.value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      const d = await api.patch('/api/me/nuke-config', config);
      setConfig({ ...EMPTY, ...d.data.config });
      setIsDefault(false); setSaved(true);
    } catch (e) {
      setError(e.message || 'Could not save.');
    } finally { setSaving(false); }
  };

  const reset = async () => {
    setSaving(true);
    try {
      await api.delete('/api/me/nuke-config');
      setConfig(EMPTY); setIsDefault(true); setSaved(true);
    } catch (e) {
      setError(e.message || 'Could not reset.');
    } finally { setSaving(false); }
  };

  if (loading) return <Loader label="Loading config" />;

  const field = 'w-full rounded-xl border border-edge bg-void px-4 py-3 text-sm outline-none transition focus:border-accent';
  const label = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-muted';

  const preview = {
    serverName: config.serverName || defaults.serverName,
    channelName: config.customChannelName || 'preset list',
    channelCount: config.channelCount || defaults.channelCount,
    spamMessage: [config.spamMessage || defaults.spamMessage, '...3 more messages above'].join('\n'),
    serverDescription: config.serverDescription || defaults.serverDescription,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Nuke Bot Config</h1>
        <p className="mt-1.5 text-sm text-muted">
          Your custom values are <strong>added</strong> on top of the defaults — every preset
          channel name and every built-in spam message still fires.
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-edge bg-surface/40 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-xs text-muted">
          Leave a field empty to use the bot default. That is also what runs when you nuke
          without signing in, so it never breaks.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor size={16} className="text-accent" />
              <h2 className="font-display font-semibold">Discord Server &amp; Nuke Engine Config</h2>
            </div>
            <Badge tone={isDefault ? 'default' : 'green'}>{isDefault ? 'Using Defaults' : 'Custom Config'}</Badge>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className={label}>New Server Name</label>
              <input className={field} value={config.serverName} onChange={set('serverName')} placeholder={defaults.serverName} />
            </div>

            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <div>
                <label className={label}>Custom Channel Name</label>
                <input className={field} value={config.customChannelName} onChange={set('customChannelName')} placeholder={defaults.customChannelName} />
                <p className="mt-1.5 text-[11px] text-dim">
                  Added to the 17 preset names, not a replacement.
                </p>
              </div>
              <div>
                <label className={label}>Channel Count</label>
                <input className={field} type="number" min={1} max={500}
                  value={config.channelCount} onChange={set('channelCount')} placeholder={String(defaults.channelCount)} />
              </div>
            </div>

            <div>
              <label className={label}>Custom Spam Message (SPAM_MESSAGE4)</label>
              <textarea className={field + ' min-h-[90px] resize-y'}
                value={config.spamMessage} onChange={set('spamMessage')} placeholder={defaults.spamMessage} />
              <p className="mt-1.5 text-[11px] text-dim">
                The other 3 spam messages always fire too.
              </p>
            </div>

            <div>
              <label className={label}>Server Description</label>
              <textarea className={field + ' min-h-[70px] resize-y'}
                value={config.serverDescription} onChange={set('serverDescription')} placeholder={defaults.serverDescription} />
            </div>

            <div>
              <label className={label}>Server Icon URL</label>
              <input className={field} value={config.serverIconUrl} onChange={set('serverIconUrl')} placeholder={defaults.serverIconUrl} />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
          {saved && <p className="mt-4 text-sm text-emerald-300">Config saved.</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={save} disabled={saving}
              className="btn-primary inline-flex flex-1 items-center justify-center gap-2 py-3 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Nuke Bot Config
            </button>
            <button onClick={reset} disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-edge px-4 py-3 text-sm text-muted transition hover:text-white disabled:opacity-60">
              <RotateCcw size={15} /> Reset to Default
            </button>
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
