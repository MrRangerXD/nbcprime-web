import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const QA = [
  {
    q: 'Nuke karne se server ka data delete ho jata hai?',
    a: 'Nahi. Nuke sirf channels/roles wipe karta hai, members aur settings safe rehte hain. Ek click me pura server fresh state me.',
  },
  {
    q: 'Rate limit (429) nahi aayega?',
    a: 'Bot me semaphore + jitter engine lagaya hai jo parallel requests ko throttle karta hai. 5000-request raid me bhi 429 nahi aata.',
  },
  {
    q: 'Premium kaise activate hota hai?',
    a: 'Crypto (LTC/SOL) bhejo, dashboard verify button dabao. Chain confirm hone par 10-30 second me premium on ho jata hai. Admin ka wait nahi.',
  },
  {
    q: 'Bot ko kitni permissions chahiye?',
    a: 'Administrator (permission=8). Kyunki channel create/delete, role manage aur mass ban — sab cover karna hai.',
  },
  {
    q: 'Free me kya milta hai?',
    a: 'Saare 60+ commands, live leaderboards aur dashboard access. Farq sirf cooldowns aur queue priority ka hai.',
  },
  {
    q: 'Refund policy?',
    a: 'Crypto payments final hain. Lekin agar payment match na ho, same amount dobara verify karke retry kar sakte ho — 30 min window milti hai.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="mx-auto max-w-3xl px-5 py-24">
      <h2 className="text-center font-display text-3xl font-bold md:text-4xl">Sawaal jawab</h2>
      <p className="mt-3 text-center text-muted">Jo sab puchte hain.</p>

      <div className="mt-10 space-y-2">
        {QA.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className={'card overflow-hidden ' + (isOpen ? 'border-accent/40' : '')}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium">{item.q}</span>
                <ChevronDown size={16} className={'shrink-0 text-muted transition-transform ' + (isOpen ? 'rotate-180 text-accent' : '')} />
              </button>
              {isOpen && (
                <p className="border-t border-edge px-5 py-4 text-sm leading-relaxed text-muted">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
