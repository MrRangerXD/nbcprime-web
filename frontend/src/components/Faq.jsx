import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const QA = [
  { q: 'Can I use the bot for free?', a: 'Yes. Every command, the dashboard, live leaderboards and backups are free. Premium only removes cooldowns and puts you at the front of the action queue — nothing is locked behind it.' },
  { q: 'How many commands does NBCPrime have?', a: '141 commands across 13 categories, available as both slash commands and prefix commands.' },
  { q: 'Does nuking delete my members?', a: 'No. A nuke only wipes channels, categories and roles, then rebuilds them from your template. Members, their roles, nicknames and join dates stay untouched.' },
  { q: 'Will I hit Discord rate limits (429)?', a: 'The bot runs a semaphore with request jitter, so parallel actions are throttled instead of fired blindly. It survives 5,000-request raids without tripping the 429 wall.' },
  { q: 'How do I activate Premium?', a: 'Open Premium from the dashboard, pick a plan, pay the exact crypto amount to the shown address, then hit Verify. Confirmation happens on-chain and Premium activates automatically — no admin needs to approve it.' },
  { q: 'What permissions does the bot need?', a: 'Administrator. It needs to create and delete channels, manage roles and permissions, and perform mass bans, so a narrower permission set would break most commands.' },
  { q: 'Can I back up and restore a server?', a: 'Yes. Snapshot channels, roles and settings with a single command, store unlimited backups, and restore them into any server you own.' },
  { q: 'Does it work with slash and prefix commands?', a: 'Both. Every slash command has a prefix equivalent, so your members can use whichever they prefer. You can also change the prefix per server.' },
  { q: 'What happens if the bot goes offline mid-nuke?', a: 'Actions already dispatched to Discord complete normally. Anything queued is retried when the bot reconnects, and the dashboard shows live gateway latency.' },
  { q: 'Is there a refund policy?', a: 'Crypto payments are final once confirmed on-chain. If a payment does not match, you get a 30 minute window to verify again — send the exact amount shown and it will reconcile.' },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-24">
      <h2 className="text-center font-display text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
      <p className="mt-3 text-center text-muted">Everything people ask before they press the button.</p>

      <div className="mt-10 space-y-2">
        {QA.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className={'card overflow-hidden ' + (isOpen ? 'border-accent/40' : '')}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium">{item.q}</span>
                <ChevronDown size={16} className={'shrink-0 text-muted transition-transform ' + (isOpen ? 'rotate-180 text-accent' : '')} />
              </button>
              {isOpen && <p className="border-t border-edge px-5 py-4 text-sm leading-relaxed text-muted">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
