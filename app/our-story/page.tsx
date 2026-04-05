'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function OurStoryPage() {
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
            <button onClick={() => router.push('/landing')} className="hover:text-stone-800 transition">Home</button>
            <button className="text-stone-900 font-bold border-b-2 border-[#C4531A] pb-0.5">Our (analog) story</button>
            <button onClick={() => router.push('/landing#how')} className="hover:text-stone-800 transition">How It Works</button>
            <button onClick={() => router.push('/landing#shop')} className="hover:text-stone-800 transition">The Ring Ring Shop</button>
            <button onClick={() => router.push('/landing#pricing')} className="hover:text-stone-800 transition">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/login')} className="text-stone-500 hover:text-stone-800 font-medium text-sm transition">Sign In</button>
            <button onClick={() => router.push('/buy')} className="px-5 py-2.5 bg-[#C4531A] text-white text-sm font-bold rounded-full hover:bg-[#a84313] transition shadow-md">
              Join the Club 🔔
            </button>
          </div>
        </div>
      </nav>

      <main>

        {/* ── Section 1: Hero ── */}
        <section className="pt-40 pb-0 px-6 overflow-hidden bg-[#FAF7F2] relative">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-amber-100 rounded-full opacity-40 blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto relative">
            <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Our Story</span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-stone-900 mt-3 mb-4 leading-[1.0] tracking-tight">
              A Better Way<br className="hidden md:block" /> to Say &ldquo;Hello&rdquo;
            </h1>
            <p className="text-xl md:text-2xl font-bold text-stone-500 mb-10 leading-snug">
              Bringing the Kitchen Wall Back to Life
            </p>

            {/* Hero photo — the 4 adults from the restaurant */}
            <div className="w-full h-72 md:h-96 rounded-3xl bg-stone-200 overflow-hidden relative shadow-md mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-800/20 to-stone-700/30" />
              <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '180px' }} />
              <div className="absolute bottom-5 left-6 right-6">
                <p className="text-white/70 text-xs italic">[Photo: The 4 adults from the restaurant]</p>
              </div>
            </div>
            <p className="text-stone-400 text-sm italic text-center mb-16">The families behind the ring.</p>
          </div>
        </section>

        {/* ── Section 2: The Nostalgia Itch ── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">The Nostalgia Itch</span>
            <h2 className="text-3xl md:text-4xl font-black text-stone-900 mt-2 mb-6 leading-tight">
              A Time That Felt Simpler
            </h2>
            <div className="space-y-5 text-stone-600 text-lg leading-relaxed mb-10">
              <p>
                We&rsquo;re nostalgic for the 80s and 90s (and possibly early 2000s?)—a time that somehow felt both simpler and more authentic. Remember when making plans meant just&hellip; waiting? If a friend was running late, you couldn&rsquo;t text them; you just sat on the curb and practiced the fine art of patience.
              </p>
              <p>
                We want our kids to know that feeling of true presence. By providing a screen-free way to connect, we hope to delay the constant pull of the digital world during such an important developmental phase in their lives.
              </p>
            </div>

            {/* 3 stock photo placeholders */}
            <div className="grid grid-cols-3 gap-4">
              {[
                'A rotary dial phone — close-up, warm light',
                'A bicycle leaning against a curb on a quiet street',
                'A handwritten note on folded paper',
              ].map((caption) => (
                <div key={caption} className="aspect-square rounded-2xl bg-stone-100 overflow-hidden relative shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-stone-200/60" />
                  <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '180px' }} />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-stone-400 text-[10px] italic leading-tight">[Stock: {caption}]</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 3: Jack & Loulou ── */}
        <section className="py-16 px-6 bg-[#FAF7F2]">
          <div className="max-w-3xl mx-auto">
            <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">The Origin Story</span>
            <h2 className="text-3xl md:text-4xl font-black text-stone-900 mt-2 mb-6 leading-tight">
              The &ldquo;Jack &amp; Loulou&rdquo; Adventure
            </h2>
            <div className="space-y-5 text-stone-600 text-lg leading-relaxed mb-10">
              <p>
                This adventure started with two families and two (real) kids, Jack and Lou Lou, who have been inseparable since their very first day of daycare in Chester County, PA. After spending five years growing up together, they inevitably had to head to different schools.
              </p>
              <p>
                They wanted a way to stay in touch after class, but when we looked at existing &ldquo;kid-safe&rdquo; home phone options, we found them to be surprisingly expensive.
              </p>
              <p>
                So, we (Bob and Christophe) decided to solve the problem ourselves. We built a cheaper, safer way to connect our own families.
              </p>
            </div>

            {/* Jack + Louise photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: 'Jack', caption: '[Photo: Jack lying down while taking a call]' },
                { label: 'Louise', caption: '[Photo: Louise taking a call on the recliner]' },
              ].map((item) => (
                <div key={item.label} className="relative">
                  <div className="w-full h-64 rounded-2xl bg-stone-200 overflow-hidden shadow-md relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-800/20 to-stone-700/30" />
                    <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '180px' }} />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white/60 text-xs italic">{item.caption}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: More Than Just a Dial Tone ── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">The Why</span>
            <h2 className="text-3xl md:text-4xl font-black text-stone-900 mt-2 mb-6 leading-tight">
              More Than Just a Dial Tone
            </h2>
            <p className="text-stone-600 text-lg leading-relaxed mb-8">
              The mental health benefits of an analog connection are real. By using a physical phone connected to a plug, kids learn to listen differently and ask questions to engage, all with fewer distractions.
            </p>

            {/* Workshop Note callout */}
            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-7">
              <div className="flex items-start gap-4">
                <span className="text-2xl flex-shrink-0">🔧</span>
                <div>
                  <p className="text-xs font-black text-[#C4531A] uppercase tracking-widest mb-2">A Note from the Workshop</p>
                  <p className="text-stone-700 text-base leading-relaxed">
                    Christophe&rsquo;s wife is an EMDR-certified art therapist. She&rsquo;ll be writing more about these mental health benefits soon&hellip; just as soon as she&rsquo;s less distracted helping us pack boxes and launch the Club.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: No Shareholders. Just Parents. ── */}
        <section className="py-16 px-6 bg-[#FAF7F2]">
          <div className="max-w-3xl mx-auto">
            <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">The Mission</span>
            <h2 className="text-3xl md:text-4xl font-black text-stone-900 mt-2 mb-6 leading-tight">
              No Shareholders. Just Parents.
            </h2>
            <p className="text-stone-600 text-lg leading-relaxed mb-8">
              What started as a small circle of friends quickly grew as other neighbors asked to join this community. Today, we are making the Ring Ring Club available more widely, but our mission hasn&rsquo;t changed.
            </p>

            {/* Three pillars */}
            <div className="space-y-4 mb-12">
              {[
                {
                  icon: '🏛️',
                  label: 'Independence',
                  body: 'We have no outside investors or corporate shareholders to answer to.',
                },
                {
                  icon: '🏷️',
                  label: 'Accessibility',
                  body: 'We are a small business, but we simply aim to keep our costs down to ensure the Club remains accessible for every family (no massive Google Ads campaigns coming your way from us).',
                },
                {
                  icon: '🤝',
                  label: 'Giving Back',
                  body: 'We are excited to use this platform to support the educators, school systems, and local institutions that serve as the foundation for our youth.',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-5 bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-black text-stone-900 text-base mb-1">{item.label}</p>
                    <p className="text-stone-500 text-sm leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Child's phone book photo */}
            <div className="w-full h-64 rounded-2xl bg-stone-200 overflow-hidden relative shadow-md">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-700/20 to-stone-600/25" />
              <div className="absolute inset-0 opacity-[0.10]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '180px' }} />
              <div className="absolute bottom-4 left-5 right-5">
                <p className="text-white/60 text-xs italic">[Photo: A child&rsquo;s hand-written &ldquo;Phone Book&rdquo; near a Post-it Rolodex — warm, film-grain]</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: Thank You to Our Early Family ── */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#1a4a3a] rounded-3xl p-10 md:p-14">
              <span className="text-amber-300 text-xs font-black uppercase tracking-widest">Thank You</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-6 leading-tight">
                Thank You to Our Early Family
              </h2>
              <div className="space-y-5 text-stone-300 text-lg leading-relaxed mb-6">
                <p>
                  To those who are already part of the Ring Ring family: Thank you. Your excitement and energy are what led us to this point. We are so thankful that you are sharing the Club with others and helping us reclaim the conversation.
                </p>
              </div>
              <blockquote className="border-l-4 border-amber-400 pl-5 py-2">
                <p className="text-amber-200 text-base leading-relaxed italic">
                  We are accountable to you, and we expect you to ground us if this adventure ever scales &ldquo;dangerously.&rdquo;
                </p>
              </blockquote>
            </div>
          </div>
        </section>

        {/* ── Section 7: To Families Considering Ring Ring ── */}
        <section className="py-16 pb-28 px-6 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">To You</span>
            <h2 className="text-3xl md:text-4xl font-black text-stone-900 mt-3 mb-6 leading-tight">
              To Families Considering Ring Ring
            </h2>
            <div className="space-y-5 text-stone-600 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              <p>
                There is something special about watching kids build their own phone etiquette and seeing them choose a conversation over more TV time.
              </p>
              <p>
                We love seeing them create their own &ldquo;Post-it&rdquo; Rolodexes and hearing that real, mechanical ring echo through the house again.
              </p>
              <p>
                When kids stop taking each other&rsquo;s presence for granted, they start having real conversations.
              </p>
              <p className="text-stone-900 font-bold text-xl">
                We think you&rsquo;ll love it, too.
              </p>
            </div>
            <button
              onClick={() => router.push('/buy')}
              className="px-10 py-4 bg-[#C4531A] text-white font-black text-sm rounded-full hover:bg-[#a84313] transition shadow-md tracking-widest"
            >
              Join the Club 🔔
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-sm mb-10">
            <div>
              <div className="text-white font-bold mb-4">The Club</div>
              <nav className="space-y-2">
                <a href="/our-story" className="block hover:text-white transition">Our Analog Story</a>
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
