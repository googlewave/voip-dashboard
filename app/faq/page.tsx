'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const sections = [
  {
    id: 'basics',
    label: 'Section 1',
    title: 'The Basics',
    subtitle: 'The "Wait, what is this?" Section',
    cards: [
      {
        q: 'What is the Ring Ring Club?',
        a: 'We are a private communication network for families who miss the "Golden Age" of the home phone. We provide the hardware and secure service to make real phones work over your internet—without apps, screens, or strangers. Ring Ring Club is operated by CP Impact LLC, based right outside Philadelphia.',
      },
      {
        q: 'Is this a "real" phone?',
        a: 'Yes. Pick it up and you\'ll hear a dial tone. If someone in your Circle of Trust calls, it will ring (loudly). It\'s 100% digital audio, but it feels like 1994.',
      },
      {
        q: 'Why not just get my kid a "dumb" cell phone?',
        a: 'Because even a "dumb" phone lives in their pocket. It follows them to the dinner table, the bathroom, and under the covers. A Ring Ring phone stays on the wall or the kitchen counter. It creates a physical boundary that says: "When you\'re on this phone, you\'re talking. When you hang up, you\'re back in the room."',
      },
    ],
  },
  {
    id: 'culture',
    label: 'Section 2',
    title: 'Culture & The Village',
    subtitle: 'Our Values',
    cards: [
      {
        q: 'What is the "Give Back" Program?',
        a: 'We believe it takes a village. We partner with local schools, libraries, and PAs to turn the Club into a fundraising tool. We aren\'t here to maximize shareholder profits; we\'re here to support the institutions that raise our kids.',
      },
      {
        q: 'Are your phones new?',
        a: 'The ones in our online store are brand new "Modern Classics." However, we love upcycling retro treasures. We often have a "Secret Stash" of thrifted, refurbished vintage phones available exclusively at our local pop-up events.',
      },
    ],
  },
  {
    id: 'hardware',
    label: 'Section 3',
    title: 'Hardware & Tech',
    subtitle: 'The Workshop Section',
    cards: [
      {
        q: 'What is the "Ring Ring Bridge"?',
        a: 'It\'s a small adapter that translates "Modern Internet" to "Old School Telephone." Plug it into your router, plug your phone into the Bridge, and you\'re in business.',
      },
      {
        q: 'Can I use my Grandma\'s rotary phone?',
        a: 'Yes! If it has a standard RJ11 jack (the little clear plastic clip) and functions, it will receive and make calls using the Ring Ring Bridge. Vintage pulse-dialing (rotary) is a bit hit-or-miss for outgoing calls, but we\'ll help you try to make that 1970s avocado green phone work if you\'re determined. (And yes, the hamburger phone works too.)',
      },
      {
        q: "Will my phone's physical features work?",
        a: 'Speed Dial: Most physical buttons on "Modern Classics" work perfectly. Caller ID: We send the data, but whether it shows up depends on your specific phone\'s hardware. Think of it as a fun workshop experiment!',
      },
    ],
  },
  {
    id: 'safety',
    label: 'Section 4',
    title: 'Safety & The Circle',
    subtitle: 'Peace of Mind',
    cards: [
      {
        q: 'Who can call my kid?',
        a: 'Only people you approve. Period. You manage your "Whitelisting" via the Dashboard. If a number isn\'t on the list, the phone simply won\'t ring. No robocalls, no strangers.',
      },
      {
        q: 'What about the 911 Stickers?',
        a: 'We are legally required to send these. You must apply them to your hardware. They remind guests and sitters that this phone relies on internet and power—if either is down, they should use a mobile phone for emergencies.',
      },
      {
        q: 'Can my kid call 911?',
        a: 'Paid Plan ("Make It Ring Ring"): Yes. E911 is legally required for accounts with a 10-digit number.\n\nStarter (Free) Plan: No. This is an internal routing system, not a true phone number. It cannot reach the public network (including 911). If you are worried about accidental 911 dials, the Starter Plan is your safest bet.',
        highlight: true,
      },
      {
        q: "Is my child's data safe?",
        a: "Absolutely. We don't listen to calls, we don't record conversations, and we don't sell your data. We are parents ourselves, and we built this to be COPPA-compliant from the ground up.",
      },
    ],
  },
  {
    id: 'dashboard',
    label: 'Section 5',
    title: 'Parental Customization',
    subtitle: 'The Dashboard',
    cards: [
      {
        q: 'How do I customize the experience?',
        a: null,
        list: [
          { label: 'Quiet Hours', detail: 'Set the phone to go dormant during dinner or bedtime.' },
          { label: 'Digital Kill Switch', detail: 'Turn the phone off instantly from your mobile.' },
          { label: 'Assign Shortcuts', detail: 'Create 1-digit speed dials for "Home" or "Grandma."' },
          { label: 'Invite', detail: 'Securely invite family members to join the Circle of Trust.' },
        ],
        prefix: 'Log into your account to access your Command Center. You can:',
      },
    ],
  },
  {
    id: 'pricing',
    label: 'Section 6',
    title: 'Pricing & Logistics',
    subtitle: 'The Nuts & Bolts',
    cards: [
      {
        q: 'How much does it cost?',
        a: null,
        pricingList: [
          { plan: 'Starter', price: '$0/mo', detail: 'Internal calls only — calls to other Ring Ring Club members, forever free.' },
          { plan: 'Make It Ring Ring', price: '$8.95/mo', detail: 'Full 10-digit number + unlimited US calling.' },
        ],
      },
      {
        q: 'Is there an Annual Discount?',
        a: 'Yes! Prepay for a year and take 10% off the total.',
      },
      {
        q: 'Upgrading or Downgrading?',
        a: 'You can switch anytime in your Dashboard. Note: If you downgrade to the Free version, you will lose your 10-digit number. Remember to port it out if you want to keep it!',
      },
      {
        q: 'Is there a contract?',
        a: 'Never. You\'re part of the Club as long as it works for your family. Cancel anytime via your dashboard with one click.',
      },
      {
        q: 'What is your return policy?',
        a: 'We offer a 30-day "Make It Ring" guarantee. If you can\'t get it working or your family just isn\'t into it, send the hardware back for a refund. No hard feelings.',
        link: { label: 'See our full Refund Policy →', href: '/refunds' },
      },
      {
        q: 'Where do you ship from?',
        a: 'Every Bridge is configured and shipped by us, right here outside Philadelphia. If you\'re local to Berwyn, give us a wave!',
      },
    ],
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const toggle = (key: string) => setOpen(open === key ? null : key);

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans">

      {/* Sticky Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#FAF7F2]/95 backdrop-blur-sm shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <button onClick={() => router.push('/landing')} className="text-xl font-black text-stone-800 tracking-tight hover:text-[#C4531A] transition">
            Ring Ring Club
          </button>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-500">
            <button onClick={() => router.push('/landing')} className="hover:text-stone-800 transition">Home</button>
            <button className="text-stone-900 font-bold border-b-2 border-[#C4531A] pb-0.5">FAQs</button>
            <button onClick={() => router.push('/setup')} className="hover:text-stone-800 transition">Setup Guides</button>
            <button onClick={() => router.push('/contact')} className="hover:text-stone-800 transition">Contact Us</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/login')} className="text-stone-500 hover:text-stone-800 font-medium text-sm transition">Sign In</button>
            <button onClick={() => router.push('/buy')} className="px-5 py-2.5 bg-[#C4531A] text-white text-sm font-bold rounded-full hover:bg-[#a84313] transition shadow-md">
              Join the Club 🔔
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-40 pb-16 px-6 text-center">
        <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">FAQ</span>
        <h1 className="text-5xl md:text-6xl font-black text-stone-900 mt-3 mb-4 leading-tight tracking-tight">
          Common Questions<br className="hidden md:block" /> from the Workshop
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto">
          Everything you need to know to get the house ringing.
        </p>
      </header>

      {/* Sections */}
      <main className="pb-24 px-6">
        <div className="max-w-4xl mx-auto space-y-16">

          {sections.map((section) => (
            <div key={section.id}>
              {/* Section header */}
              <div className="mb-6">
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">{section.label}</span>
                <h2 className="text-3xl font-black text-stone-900 mt-1 leading-tight">{section.title}</h2>
                <p className="text-stone-400 text-sm mt-1 italic">{section.subtitle}</p>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.cards.map((card) => {
                  const key = `${section.id}-${card.q}`;
                  const isOpen = open === key;
                  return (
                    <div
                      key={key}
                      className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${card.highlight ? 'border-red-100' : 'border-stone-100'}`}
                    >
                      <button
                        onClick={() => toggle(key)}
                        className="w-full text-left px-6 py-5 flex items-start justify-between gap-4"
                      >
                        <span className="font-black text-stone-900 text-base leading-snug">{card.q}</span>
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-transform ${isOpen ? 'border-[#C4531A] text-[#C4531A] rotate-45' : 'border-stone-300 text-stone-400'}`}>
                          +
                        </span>
                      </button>

                      {isOpen && (
                        <div className={`px-6 pb-6 border-t ${card.highlight ? 'border-red-50 bg-red-50/30' : 'border-stone-50 bg-stone-50/50'}`}>
                          <div className="pt-4">
                            {card.prefix && (
                              <p className="text-stone-600 text-sm leading-relaxed mb-3">{card.prefix}</p>
                            )}
                            {card.a && (
                              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{card.a}</p>
                            )}
                            {card.list && (
                              <ul className="space-y-2">
                                {card.list.map((item) => (
                                  <li key={item.label} className="flex items-start gap-2 text-sm text-stone-600">
                                    <span className="w-1.5 h-1.5 bg-[#C4531A] rounded-full mt-1.5 flex-shrink-0" />
                                    <span><strong className="text-stone-900">{item.label}:</strong> {item.detail}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {card.pricingList && (
                              <div className="space-y-3">
                                {card.pricingList.map((item) => (
                                  <div key={item.plan} className="flex items-start gap-3 bg-white border border-stone-100 rounded-xl p-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                                      <span className="text-[#C4531A] font-black text-xs">{item.price.replace('/mo','')}</span>
                                    </div>
                                    <div>
                                      <p className="font-bold text-stone-900 text-sm">{item.plan}</p>
                                      <p className="text-stone-500 text-xs leading-snug">{item.detail}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {'link' in card && card.link && (
                              <a href={card.link.href} className="inline-block mt-3 text-[#C4531A] text-sm hover:underline font-medium">
                                {card.link.label}
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Final CTA */}
          <div className="bg-[#1a4a3a] rounded-3xl p-12 text-center">
            <span className="text-amber-300 text-xs font-black uppercase tracking-widest">Still Have a Question?</span>
            <h2 className="text-3xl font-black text-white mt-3 mb-3 leading-tight">
              Send a Digital Dispatch to the workshop floor.
            </h2>
            <p className="text-stone-300 text-base mb-8 max-w-md mx-auto">
              A real human — usually one of the founders — will read it and get back to you.
            </p>
            <button
              onClick={() => router.push('/contact')}
              className="px-10 py-4 bg-[#FAF7F2] text-[#1a4a3a] font-black text-sm rounded-full hover:bg-white transition tracking-widest"
            >
              TALK TO THE WORKSHOP
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-sm mb-10">
            <div>
              <div className="text-white font-bold mb-4">The Club</div>
              <nav className="space-y-2">
                <a href="#" className="block hover:text-white transition">Our Analog Story</a>
                <a href="#" className="block hover:text-white transition">How It Works</a>
                <a href="#" className="block hover:text-white transition">The Shop</a>
                <a href="#" className="block hover:text-white transition">Pricing</a>
                <a href="/community" className="block hover:text-white transition">Community</a>
              </nav>
            </div>
            <div>
              <div className="text-white font-bold mb-4">Support</div>
              <nav className="space-y-2">
                <a href="/faq" className="block hover:text-white transition">FAQs</a>
                <a href="/setup" className="block hover:text-white transition">Setup Guides</a>
                <a href="/contact" className="block hover:text-white transition">Contact Us</a>
              </nav>
            </div>
            <div>
              <div className="text-white font-bold mb-4">Account</div>
              <nav className="space-y-2">
                <a href="/login" className="block hover:text-white transition">Log In</a>
                <a href="/buy" className="block hover:text-white transition">Sign Up</a>
                <a href="/invite" className="block hover:text-white transition">Invite a Neighbor</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-600">
            <p>&copy; 2026 Ring Ring Club (CP Impact LLC). All rights reserved.</p>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <a href="/terms" className="hover:text-stone-400 transition">Terms of Service</a>
              <span aria-hidden="true">|</span>
              <a href="/privacy" className="hover:text-stone-400 transition">Privacy Policy</a>
              <span aria-hidden="true">|</span>
              <a href="/e911" className="hover:text-stone-400 transition">E911 Disclosure</a>
              <span aria-hidden="true">|</span>
              <a href="/refunds" className="hover:text-stone-400 transition">Refund Policy</a>
            </nav>
          </div>
        </div>
      </footer>

    </div>
  );
}
