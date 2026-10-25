import { Hash, Zap } from 'lucide-react';

export default function DiscordPreview({ config, botName = 'NBCPrime' }) {
  return (
    <div className="rounded-xl border border-edge bg-[#313338] p-3">
      <div className="flex items-center gap-2 border-b border-black/30 pb-2">
        <Hash size={15} className="text-white/40" />
        <span className="text-sm font-semibold text-white/90">{config.channelName || 'nuked'}</span>
        <span className="ml-auto truncate text-xs text-white/40">{config.serverName || 'My Server'}</span>
      </div>

      <div className="mt-3 space-y-4">
        <div className="flex gap-2.5">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/20">
            <Zap size={14} className="text-accent" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-accent">{botName}</span>
              <span className="rounded bg-[#5865f2] px-1 py-px text-[9px] font-bold text-white">BOT</span>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-white/85">
              {config.spamMessage || 'Server has been nuked!'}
            </p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-[#5865f2]/25" />
          <div className="min-w-0">
            <span className="text-sm font-semibold text-accent">{botName}</span>
            <div className="mt-1 border-l-[3px] border-white/20 pl-3">
              <p className="text-sm font-semibold text-white/90">{config.serverName || 'My Server'}</p>
              <p className="mt-0.5 break-words text-xs text-white/60">
                {config.serverDescription || 'Destroyed by NBCPrime'}
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/35">
          {config.channelCount || 50} channels created
        </p>
      </div>
    </div>
  );
}
