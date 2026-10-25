import { Bot, Zap, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { BOTS, MIN_MEMBERS, inviteUrl } from '../lib/bots';

export default function InviteBotModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-edge bg-panel p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted transition hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-edge bg-surface">
          <Bot size={22} className="text-accent" />
        </div>

        <h2 className="mt-4 text-center font-display text-xl font-bold">Invite Bot To Server</h2>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted">
          Choose the bot you want to add to your Discord server to activate exclusive features.
        </p>

        <div className="mt-6 space-y-3">
          {BOTS.map((bot) => (
            <div
              key={bot.id}
              className="flex items-center gap-4 rounded-xl border border-edge bg-surface/50 p-4"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-edge bg-void">
                {bot.id === 'nuke' ? (
                  <Bot size={18} className="text-accent" />
                ) : (
                  <Zap size={18} className="text-amber-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{bot.name}</p>
                <p className="text-xs text-muted">{bot.description}</p>
              </div>
              <a
                href={inviteUrl(bot)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-xs"
              >
                Invite Bot <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3 rounded-xl border border-edge bg-surface/50 p-4">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-300" />
          <div>
            <p className="text-sm font-semibold">{MIN_MEMBERS}+ Members Required</p>
            <p className="mt-0.5 text-xs text-muted">
              Your server needs at least {MIN_MEMBERS} members to add the bot, otherwise the bot
              will leave automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
