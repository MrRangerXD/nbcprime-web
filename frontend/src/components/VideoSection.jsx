import { useState } from 'react';
import { Play } from 'lucide-react';

// Swap these for your own video.
const VIDEO_ID = 'vWfsZUlfStY'; // YouTube video id
const VIDEO_TITLE = 'How to NUKE a Discord Server';
const VIDEO_SUB = 'Like & Subscribe · Tutorial';

export default function VideoSection() {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:py-24">
      <div className="mb-10 max-w-2xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">Watch</p>
        <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">
          See the nuke engine in action
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          A two minute walkthrough: invite the bot, run <span className="mono">$nuke</span>, and watch
          a server get rebuilt from scratch.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
        <div className="relative aspect-video w-full">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
              title={VIDEO_TITLE}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 h-full w-full"
              aria-label="Play video"
            >
              <img src={thumb} alt={VIDEO_TITLE} className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-black/45 transition group-hover:bg-black/30" />
              <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-black transition group-hover:scale-110">
                <Play size={22} className="ml-0.5" />
              </span>
              <span className="absolute bottom-5 left-5 text-left">
                <span className="block font-display text-lg font-bold">{VIDEO_TITLE}</span>
                <span className="block text-xs text-white/70">{VIDEO_SUB}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
