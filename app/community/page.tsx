'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function CommunityPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans">

      {/* Sticky Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#FAF7F2]/95 backdrop-blur-sm shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <button onClick={() => router.push('/landing')} className="text-xl font-black text-stone-800 tracking-tight hover:text-[#C4531A] transition">
            Ring Ring Club
          </button>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-500">
            <a href="/landing" className="hover:text-stone-800 transition">Home</a>
            <a href="/landing#story" className="hover:text-stone-800 transition">Our (analog) story</a>
            <a href="/landing#how" className="hover:text-stone-800 transition">How It Works</a>
            <a href="/landing#shop" className="hover:text-stone-800 transition">The Ring Ring Shop</a>
            <a href="/landing#pricing" className="hover:text-stone-800 transition">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/login')} className="text-stone-500 hover:text-stone-800 font-medium text-sm transition">Sign In</button>
            <button onClick={() => router.push('/buy')} className="px-5 py-2.5 bg-[#C4531A] text-white text-sm font-bold rounded-full hover:bg-[#a84313] transition shadow-md">
              Join the Club 🔔
            </button>
          </div>
        </div>
      </nav>

      {/* ── Section 1: Header / Village Core ── */}
      <header className="relative pt-40 pb-20 px-6 overflow-hidden bg-[#FAF7F2]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-amber-100 rounded-full opacity-50 blur-3xl" />
          <div className="absolute bottom-0 -left-32 w-96 h-96 bg-orange-100 rounded-full opacity-40 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="text-[#C4531A] font-semibold text-xs uppercase tracking-widest">Ring Ring Club</span>
          <h1 className="text-6xl md:text-7xl font-black text-stone-900 mt-3 mb-5 leading-[1.0] tracking-tight">
            The Neighborhood
          </h1>
          <p className="text-xl font-bold text-stone-600 mb-6 leading-snug">
            It Takes a Village: Supporting the schools and institutions that raise us.
          </p>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl mx-auto">
            At the Ring Ring Club, we believe that the strongest connections happen locally. We&apos;re not just building a phone network; we&apos;re supporting the community infrastructure—the schools, libraries, and associations—that makes our children&apos;s world possible.
          </p>
        </div>
      </header>

      {/* ── Section 2: The Give Back Program ── */}
      <section id="give-back" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Visual placeholder */}
            <div className="rounded-3xl overflow-hidden bg-amber-50 border-2 border-amber-100 aspect-[4/3] flex items-center justify-center relative">
              <div className="text-center p-8">
                <div className="text-7xl mb-4">📚</div>
                <p className="text-amber-700 text-sm font-semibold italic">
                  [Photo: A vintage phone on a stack of library books or a Family Night table]
                </p>
              </div>
            </div>

            {/* Copy */}
            <div>
              <span className="text-[#C4531A] font-semibold text-xs uppercase tracking-widest">Community</span>
              <h2 className="text-4xl font-black text-stone-900 mt-3 mb-5 leading-tight">The &ldquo;Give Back&rdquo; Program</h2>
              <p className="text-stone-500 text-base leading-relaxed mb-8">
                Every dollar counts in the world of non-profits and schools. We don&apos;t want this to be a sales pitch; we want to be a partner in your fundraising goals.
              </p>

              <div className="space-y-5 mb-10">
                {[
                  {
                    icon: '🤝',
                    title: 'Collaborative Fundraising',
                    body: 'We love collaborating with parent associations, social leagues, and libraries.',
                  },
                  {
                    icon: '🎪',
                    title: 'Events & Auctions',
                    body: "Whether it's joining a silent auction, hosting an \"analog\" table at a family night event, or giving back a portion of sales made during a school function, we are ready to help.",
                  },
                  {
                    icon: '🏫',
                    title: 'The Backbone',
                    body: "Schools and local nonprofits are the backbone of our youth's education, and it is critical to give back to the institutions that serve them.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-black text-stone-900 text-sm mb-1">{item.title}</p>
                      <p className="text-stone-500 text-sm leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#FAF7F2] rounded-2xl p-6 border border-stone-100">
                <p className="text-stone-600 text-sm leading-relaxed mb-4">
                  <strong className="text-stone-900">Have a project in mind?</strong> If you are an educator or active in your local PA, send a dispatch to the workshop. We&apos;d love to help you hit your goals.
                </p>
                <a
                  href="mailto:support@ringringphone.com"
                  className="inline-block px-6 py-3 bg-[#C4531A] text-white text-sm font-bold rounded-full hover:bg-[#a84313] transition"
                >
                  Send a Dispatch →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Become a Ring Ring Leader ── */}
      <section id="leader" className="py-24 px-6 bg-[#FAF7F2]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C4531A] font-semibold text-xs uppercase tracking-widest">Join the Movement</span>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 mt-3 mb-5 leading-tight">
              Become a (Legal) &ldquo;Ring Ring Leader&rdquo;
            </h2>
            <p className="text-stone-500 text-lg max-w-2xl mx-auto leading-relaxed">
              We are currently hosting pop-ups in communities already on Ring Ring. If you want to help grow new circles of trust, send us a note. We aren&apos;t looking for &ldquo;influencers&rdquo;—we&apos;re looking for parents who want to bring the conversation back to their own streets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: '🍋',
                title: 'Host a Local Pop-Up',
                body: "Want to host a small event in your driveway with a lemonade stand, at a school function, or in your favorite local nook? We'll send you a \"Leader Kit\" to help you host and show your neighbors how the magic happens.",
                bg: 'bg-amber-50 border-amber-100',
                numColor: 'text-amber-500',
                num: '01',
              },
              {
                icon: '☎️',
                title: 'Upcycling Retro Treasures',
                body: 'If you have a collection of vintage or "modern classic" phones you\'d like to see upcycled and made available to your community through the Club, let\'s talk.',
                bg: 'bg-teal-50 border-teal-100',
                numColor: 'text-teal-600',
                num: '02',
              },
              {
                icon: '🗝️',
                title: 'The "Secret Stash" Retro Inventory',
                body: "We don't list our full catalog online because our inventory changes every day. We prefer to bring these curated treasures to our local pop-up events so you can hear the ring in person.",
                bg: 'bg-orange-50 border-orange-100',
                numColor: 'text-[#C4531A]',
                num: '03',
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-3xl p-8 border-2 ${item.bg} hover:shadow-lg transition`}>
                <div className={`text-xs font-black tracking-widest mb-4 ${item.numColor}`}>{item.num}</div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-black text-stone-900 mb-3">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          {/* Visual placeholders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 aspect-video flex items-center justify-center">
              <div className="text-center p-6">
                <div className="text-5xl mb-3">🛠️</div>
                <p className="text-stone-500 text-sm italic">[Photo: Leader Kit on a wooden workbench — Bridge, coiled cord, stickers]</p>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 aspect-video flex items-center justify-center">
              <div className="text-center p-6">
                <div className="text-5xl mb-3">🔐</div>
                <p className="text-stone-500 text-sm italic">[Photo: A "Secret Stash" retro phone — unique, unlisted inventory]</p>
              </div>
            </div>
          </div>

          <div className="bg-stone-800 text-stone-300 rounded-2xl px-8 py-5 max-w-2xl mx-auto text-center text-sm">
            <p>Can&apos;t make it to an event? <a href="mailto:support@ringringphone.com" className="text-amber-400 font-bold hover:text-amber-300 transition underline">Email us</a> to hear what we currently have in storage.</p>
          </div>
        </div>
      </section>

      {/* ── Section 4: The Resource Library ── */}
      <section id="resources" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C4531A] font-semibold text-xs uppercase tracking-widest">Resources</span>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 mt-3 mb-5 leading-tight">The Resource Library</h2>
            <p className="text-stone-500 text-lg max-w-2xl mx-auto leading-relaxed">
              We want to help your family make the transition to analog as fun as possible, without adding more digital clutter to your life. Whether you want to DIY it at home or have us ship you the &ldquo;fancy&rdquo; versions, we&apos;ve got you covered.
            </p>
          </div>

          {/* ── Sub-section A: The Free Stuff ── */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-stone-100" />
              <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">The Free Stuff</h3>
              <div className="h-px flex-1 bg-stone-100" />
            </div>

            {/* Visual placeholder */}
            <div className="rounded-3xl bg-amber-50 border-2 border-amber-100 p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
              <div className="text-6xl flex-shrink-0">📋</div>
              <div>
                <p className="text-amber-800 font-bold text-sm mb-1">[Image: Cheat Sheet or Phone Book with a child's handwriting + a Post-it note]</p>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Download these, fire up the home printer, and let your kids start building their analog world.
                </p>
              </div>
            </div>

            {/* Command Center Cards — Free downloads */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cheat Sheet */}
              <div className="rounded-3xl border-2 border-stone-100 bg-[#FAF7F2] p-8 hover:shadow-lg transition flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mb-5 shadow-sm">
                  {/* Line-art download icon */}
                  <svg className="w-6 h-6 text-stone-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </div>
                <h4 className="font-black text-stone-900 text-base mb-2">The Ring Ring Cheat Sheet</h4>
                <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-1">
                  Pretty quickly, your kiddos will want a way to find their friends&apos; numbers. We started our own kids off with Post-its (still love them), but this one-page sheet keeps the top numbers handy.
                </p>
                <div className="flex flex-col gap-2 mt-auto">
                  <a href="#" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-full hover:bg-stone-700 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                    Download PDF — print at home
                  </a>
                  <a href="#" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-stone-700 text-xs font-bold rounded-full hover:bg-stone-50 transition">
                    Order a printed version
                  </a>
                </div>
              </div>

              {/* Phone Book */}
              <div className="rounded-3xl border-2 border-stone-100 bg-[#FAF7F2] p-8 hover:shadow-lg transition flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mb-5 shadow-sm">
                  {/* Line-art print icon */}
                  <svg className="w-6 h-6 text-stone-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                </div>
                <h4 className="font-black text-stone-900 text-base mb-2">The Ring Ring Phone Book</h4>
                <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-1">
                  A free download to help your kids start their first official &ldquo;Circle of Trust&rdquo; directory.
                </p>
                <div className="flex flex-col gap-2 mt-auto">
                  <a href="#" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-full hover:bg-stone-700 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                    Download and assemble at home
                  </a>
                  <a href="#" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-stone-700 text-xs font-bold rounded-full hover:bg-stone-50 transition">
                    Order the professional edition
                  </a>
                </div>
              </div>

              {/* Playlist */}
              <div className="rounded-3xl border-2 border-teal-100 bg-teal-50 p-8 hover:shadow-lg transition flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-white border border-teal-200 flex items-center justify-center mb-5 shadow-sm">
                  {/* Line-art headphone/listen icon */}
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>
                <h4 className="font-black text-stone-900 text-base mb-2">The &ldquo;Ring Club&rdquo; Playlist</h4>
                <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-1">
                  A curated mix of 80s and 90s music from the last great era of the landline.
                </p>
                <div className="mt-auto">
                  <a
                    href="https://open.spotify.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1DB954] text-white text-xs font-bold rounded-full hover:bg-[#1aa34a] transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                    Listen on Spotify
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sub-section B: The Stuff We Can't Make Free ── */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-stone-100" />
              <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">The Stuff We Can&apos;t Afford to Make Free</h3>
              <div className="h-px flex-1 bg-stone-100" />
            </div>

            {/* Visual placeholder */}
            <div className="rounded-3xl bg-stone-50 border-2 border-stone-100 p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
              <div className="text-6xl flex-shrink-0">🃏</div>
              <div>
                <p className="text-stone-600 font-bold text-sm mb-1">[Photo: Close-up of Calling Cards — hand-drawn design on professional cardstock]</p>
                <p className="text-stone-500 text-sm leading-relaxed">
                  These items are professionally printed and shipped from our home workshop.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6 text-stone-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                  ),
                  title: 'Calling Cards',
                  body: 'Cards we designed so kids can safely share their "Club Number" with friends at school or daycare the good old fashioned way.',
                  note: 'Design credit to Jen.',
                  bg: 'bg-[#FAF7F2] border-stone-100',
                },
                {
                  icon: (
                    <svg className="w-6 h-6 text-stone-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  ),
                  title: 'Professional Prints',
                  body: 'Get the high-end, professionally-printed and assembled versions of the Ring Ring Phone Book and the Number Cheat Sheet.',
                  note: null,
                  bg: 'bg-[#FAF7F2] border-stone-100',
                },
                {
                  icon: (
                    <svg className="w-6 h-6 text-stone-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                  ),
                  title: 'Ring Ring Stickers',
                  body: 'The final touch for any vintage handset. Or bedroom door, as it turns out.',
                  note: null,
                  bg: 'bg-[#FAF7F2] border-stone-100',
                },
              ].map((item) => (
                <div key={item.title} className={`rounded-3xl border-2 ${item.bg} p-8 hover:shadow-lg transition flex flex-col`}>
                  <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mb-5 shadow-sm">
                    {item.icon}
                  </div>
                  <h4 className="font-black text-stone-900 text-base mb-2">{item.title}</h4>
                  <p className="text-stone-500 text-sm leading-relaxed flex-1">{item.body}</p>
                  {item.note && <p className="text-stone-400 text-xs italic mt-2">{item.note}</p>}
                  <a href="#" className="mt-6 inline-block px-5 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-full hover:bg-stone-700 transition text-center">
                    Shop Now →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: The Community Roadmap ── */}
      <section id="roadmap" className="py-24 px-6 bg-[#FAF7F2]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#C4531A] font-semibold text-xs uppercase tracking-widest">What&apos;s Next</span>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 mt-3 mb-5 leading-tight">
              We want you to own<br />the future of the Club.
            </h2>
            <p className="text-stone-500 text-lg leading-relaxed max-w-2xl mx-auto">
              We are having a lot of fun rolling out new features and controls behind the scenes. But we don&apos;t want to build this in a vacuum. We want our community to own the Ring Ring Roadmap—evolving this project alongside other parents and friends to ensure we&apos;re actually making things better for our kids.
            </p>
          </div>

          {/* First Call visual */}
          <div className="rounded-3xl bg-stone-100 border border-stone-200 aspect-video max-w-lg mx-auto flex items-center justify-center mb-12">
            <div className="text-center p-8">
              <div className="text-5xl mb-3">📞</div>
              <p className="text-stone-400 text-sm italic">[Photo: A &ldquo;First Call&rdquo; moment — handset in focus, face blurred]</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: '💡',
                title: 'Send us your ideas',
                body: 'What would make your analog home even better?',
                bg: 'bg-amber-50 border-amber-100',
              },
              {
                icon: '📖',
                title: 'Share your wishes',
                body: 'Is there a specific vintage phone style or feature you\'re looking for?',
                bg: 'bg-teal-50 border-teal-100',
              },
              {
                icon: '📸',
                title: 'The First Call',
                body: 'We would love to see pictures or videos of that very first dial tone or the look on your kid\'s face when the phone actually rings. To keep things safe, we will always blur kids\' faces before posting anything.',
                bg: 'bg-orange-50 border-orange-100',
              },
              {
                icon: '🔍',
                title: 'Tell us the truth',
                body: 'If something isn\'t working for your family, we want to know so we can fix it.',
                bg: 'bg-stone-50 border-stone-200',
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-3xl p-8 border-2 ${item.bg} hover:shadow-lg transition`}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-black text-stone-900 text-base mb-2">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="mailto:support@ringringphone.com"
              className="inline-block px-8 py-4 bg-[#C4531A] text-white font-bold rounded-full hover:bg-[#a84313] transition shadow-lg text-sm"
            >
              Send us a note →
            </a>
          </div>
        </div>
      </section>

      {/* ── Section 6: Gratitude & Accountability ── */}
      <section id="gratitude" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <hr className="border-stone-100 mb-16" />
          <div className="text-center mb-10">
            <span className="text-[#C4531A] font-semibold text-xs uppercase tracking-widest">A Note of Gratitude &amp; Accountability</span>
          </div>
          <div className="space-y-6 text-stone-600 text-lg leading-relaxed">
            <p>
              To those who are already part of the Ring Ring family: <strong className="text-stone-900">Thank you.</strong> Your excitement and energy are exactly what led us to move beyond our own kitchen tables and start this adventure. We are so thankful that you are sharing the Club with others and helping us reclaim the art of conversation.
            </p>
            <p>
              We feel deeply accountable to all of you. We are a family(ies)-run operation with no outside investors or shareholder profits to maximize, which means our only priority is our members. We expect you to ground us if this adventure ever scales &ldquo;dangerously&rdquo;. We never want to lose the human touch that made us start this in the first place.
            </p>
          </div>
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => router.push('/buy')}
              className="px-10 py-4 bg-stone-900 text-white text-base font-bold rounded-full hover:bg-stone-700 transition shadow-xl"
            >
              Join the Club 🔔
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 7: Footer Mood / Spotify ── */}
      <section className="py-16 px-6 bg-stone-900">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-stone-400 text-xs uppercase tracking-widest mb-6">The Mood</p>
          <h2 className="text-2xl font-black text-white mb-3">The &ldquo;Ring Club&rdquo; Playlist</h2>
          <p className="text-stone-400 text-sm mb-8">A curated mix of 80s and 90s music from the last great era of the landline.</p>
          {/* Spotify embed — replace with real playlist URI when available */}
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              title="Ring Club Playlist"
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DX4UtSsGT1Sbe?utm_source=generator&theme=0"
              width="100%"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="block"
            />
          </div>
          <p className="text-stone-600 text-xs mt-4 italic">Playlist placeholder — swap the Spotify URL for the official Ring Club playlist when ready.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-sm mb-10">
            <div>
              <div className="text-white font-bold mb-4">The Club</div>
              <nav aria-label="The Club" className="space-y-2">
                <a href="#" className="block hover:text-white transition">Our Analog Story</a>
                <a href="#" className="block hover:text-white transition">How It Works</a>
                <a href="#" className="block hover:text-white transition">The Shop</a>
                <a href="#" className="block hover:text-white transition">Pricing</a>
                <a href="/community" className="block hover:text-white transition">Community</a>
              </nav>
            </div>
            <div>
              <div className="text-white font-bold mb-4">Support</div>
              <nav aria-label="Support" className="space-y-2">
                <a href="/faq" className="block hover:text-white transition">FAQs</a>
                <a href="/setup" className="block hover:text-white transition">Setup Guides</a>
                <a href="/contact" className="block hover:text-white transition">Contact Us</a>
              </nav>
            </div>
            <div>
              <div className="text-white font-bold mb-4">Account</div>
              <nav aria-label="Account" className="space-y-2">
                <a href="/login" className="block hover:text-white transition">Log In</a>
                <a href="/buy" className="block hover:text-white transition">Sign Up</a>
                <a href="/invite" className="block hover:text-white transition">Invite a Neighbor</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-600">
            <p>&copy; 2026 Ring Ring Club. All rights reserved.</p>
            <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-1">
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
