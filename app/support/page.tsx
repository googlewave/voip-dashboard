'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SupportPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const cards = [
    {
      icon: (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="8" y="28" width="28" height="22" rx="3" stroke="#C4531A" strokeWidth="2.5" fill="none"/>
          <rect x="44" y="36" width="28" height="16" rx="3" stroke="#C4531A" strokeWidth="2.5" fill="none"/>
          <line x1="36" y1="34" x2="44" y2="38" stroke="#C4531A" strokeWidth="2" strokeDasharray="3 2"/>
          <circle cx="22" cy="56" r="5" stroke="#C4531A" strokeWidth="2" fill="none"/>
          <line x1="22" y1="50" x2="22" y2="28" stroke="#C4531A" strokeWidth="2"/>
          <path d="M14 20 Q22 14 30 20" stroke="#C4531A" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M10 16 Q22 8 34 16" stroke="#C4531A" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeOpacity="0.5"/>
        </svg>
      ),
      label: 'Setup Guides',
      headline: 'Start Here. Let\'s get the house ringing.',
      body: 'Modular instructions for the Bridge, Analog Bundle, and standalone VoIP Phones. Follow your path.',
      cta: 'SEE GUIDES',
      href: '/setup',
      bg: 'bg-white',
      border: 'border-stone-100',
      ctaBg: 'bg-[#C4531A] hover:bg-[#a84313] text-white',
    },
    {
      icon: (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="28" cy="36" r="14" stroke="#1a4a3a" strokeWidth="2.5" fill="none"/>
          <circle cx="54" cy="28" r="10" stroke="#1a4a3a" strokeWidth="2" fill="none"/>
          <text x="23" y="41" fontSize="14" fill="#1a4a3a" fontWeight="bold">?</text>
          <text x="50" y="33" fontSize="10" fill="#1a4a3a" fontWeight="bold">?</text>
          <circle cx="42" cy="52" r="7" stroke="#1a4a3a" strokeWidth="2" fill="none"/>
          <text x="39" y="57" fontSize="8" fill="#1a4a3a">i</text>
        </svg>
      ),
      label: 'FAQ',
      headline: 'Got a question? We\'ve probably answered it.',
      body: 'Search our exhaustive answers on tech, billing, safety, and life with Ring Ring.',
      cta: 'SEARCH FAQ',
      href: '/faq',
      bg: 'bg-[#1a4a3a]',
      border: 'border-[#1a4a3a]',
      ctaBg: 'bg-[#FAF7F2] hover:bg-white text-[#1a4a3a]',
      dark: true,
    },
    {
      icon: null,
      photo: true,
      label: 'Contact Us',
      headline: 'Need a human? We\'re here in Chester County to help.',
      body: 'Reach out via Email, Phone, or Dashboard during business hours.',
      cta: 'GET IN TOUCH',
      href: '/contact',
      bg: 'bg-white',
      border: 'border-stone-100',
      ctaBg: 'bg-[#C4531A] hover:bg-[#a84313] text-white',
    },
  ];

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
            <button onClick={() => router.push('/faq')} className="hover:text-stone-800 transition">FAQs</button>
            <button onClick={() => router.push('/setup')} className="hover:text-stone-800 transition">Setup Guides</button>
            <button className="text-stone-900 font-bold border-b-2 border-[#C4531A] pb-0.5">Contact Us</button>
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
        <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Support Hub</span>
        <h1 className="text-5xl md:text-6xl font-black text-stone-900 mt-3 mb-4 leading-tight tracking-tight">
          Support Hub
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto leading-relaxed">
          Everything you need to get the house ringing — and keep it that way.
        </p>
      </header>

      {/* Three Command Center Cards */}
      <main className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`${card.bg} border ${card.border} rounded-3xl shadow-sm overflow-hidden flex flex-col`}
            >
              {/* Illustration / Photo area */}
              <div className={`h-52 flex items-center justify-center p-8 ${card.dark ? '' : 'bg-stone-50'}`}>
                {card.photo ? (
                  <div className="w-full h-full rounded-2xl bg-stone-200 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-stone-700/40" />
                    <span className="relative text-stone-400 text-xs italic text-center px-4">
                      [Photo: Workshop desk with tools, coiled cord, handset]
                    </span>
                  </div>
                ) : (
                  <div className="w-32 h-32">
                    {card.icon}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-8 flex flex-col flex-1">
                <span className={`text-xs font-black uppercase tracking-widest mb-2 ${card.dark ? 'text-amber-300' : 'text-[#C4531A]'}`}>
                  {card.label}
                </span>
                <h2 className={`text-2xl font-black leading-tight mb-3 ${card.dark ? 'text-white' : 'text-stone-900'}`}>
                  {card.headline}
                </h2>
                <p className={`text-sm leading-relaxed mb-8 flex-1 ${card.dark ? 'text-stone-300' : 'text-stone-500'}`}>
                  {card.body}
                </p>
                <button
                  onClick={() => router.push(card.href)}
                  className={`w-full py-3.5 rounded-full text-sm font-black tracking-widest transition ${card.ctaBg}`}
                >
                  {card.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nudge */}
        <div className="max-w-2xl mx-auto text-center mt-16">
          <p className="text-stone-400 text-sm">
            CP Impact LLC, d/b/a Ring Ring Club · Berwyn, PA 19312 ·{' '}
            <a href="mailto:support@ringringphone.com" className="text-[#C4531A] hover:underline">support@ringringphone.com</a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-sm mb-10">
            <div>
              <div className="text-white font-bold mb-4">The Club</div>
              <nav className="space-y-2">
                <a href="/our-story" className="block hover:text-white transition">Our Analog Story</a>
                <a href="/landing#how" className="block hover:text-white transition">How It Works</a>
                <a href="/landing#shop" className="block hover:text-white transition">The Shop</a>
                <a href="/landing#pricing" className="block hover:text-white transition">Pricing</a>
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
