export default function DiscordPreview({ config = {} }) {
  const {
    serverName = 'NBC ON TOP',
    channelName = 'raided-by-nbc',
    channelCount = 100,
    spamMessage = 'Server destroyed by NBC',
    serverDescription = '',
  } = config;

  const lines = String(spamMessage).split('\n').filter(Boolean);

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-[#313338]">
      {/* server header */}
      <div className="flex items-center gap-3 border-b border-black/30 bg-[#2b2d31] px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-bold text-black">
          {serverName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'NB'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{serverName}</p>
          <p className="truncate text-[11px] text-[#949ba4]">{channelCount} channels</p>
        </div>
      </div>

      <div className="flex">
        {/* channel list */}
        <div className="hidden w-32 shrink-0 space-y-1 border-r border-black/30 bg-[#2b2d31] p-2 sm:block">
          {[channelName, 'general', 'spam', 'rules'].slice(0, 4).map((c, i) => (
            <p
              key={c + i}
              className={
                'truncate rounded px-2 py-1 text-[11px] ' +
                (i === 0 ? 'bg-white/10 text-white' : 'text-[#949ba4]')
              }
            >
              # {c}
            </p>
          ))}
        </div>

        {/* messages */}
        <div className="min-w-0 flex-1 space-y-3 p-3">
          {lines.slice(0, 3).map((line, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-black">
                NBC
              </div>
              <div className="min-w-0">
                <p className="text-[11px]">
                  <span className="font-semibold text-white">NBC-SYSTEM</span>
                  <span className="ml-1.5 rounded bg-[#5865f2] px-1 py-px text-[9px] font-semibold text-white">BOT</span>
                </p>
                <p className="mt-0.5 break-words text-[12px] leading-relaxed text-[#dbdee1]">
                  {line.replace(/\*\*/g, '').replace(/@everyone/, '@everyone')}
                </p>
              </div>
            </div>
          ))}
          {lines.length === 0 && (
            <p className="py-4 text-center text-[11px] text-[#949ba4]">No spam message set.</p>
          )}
        </div>
      </div>

      {serverDescription && (
        <div className="border-t border-black/30 bg-[#2b2d31] px-4 py-2">
          <p className="truncate text-[10px] text-[#949ba4]">{serverDescription}</p>
        </div>
      )}
    </div>
  );
}