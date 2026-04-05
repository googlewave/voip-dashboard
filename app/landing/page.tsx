'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [annual, setAnnual] = useState(false);

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
          <div className="text-xl font-black text-stone-800 tracking-tight">Ring Ring Club</div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-500">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-stone-800 transition">Home</button>
            <button onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-stone-800 transition">Our (analog) story</button>
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-stone-800 transition">How It Works</button>
            <button onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-stone-800 transition">The Ring Ring Shop</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-stone-800 transition">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/login')} className="text-stone-500 hover:text-stone-800 font-medium text-sm transition">Sign In</button>
            <button onClick={() => router.push('/buy')} className="px-5 py-2.5 bg-[#C4531A] text-white text-sm font-bold rounded-full hover:bg-[#a84313] transition shadow-md">
              Join the Club 🔔
            </button>
          </div>
        </div>
      </nav>

      {/* Beat 1 — Hero */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-[#FAF7F2]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-amber-100 rounded-full opacity-50 blur-3xl" />
          <div className="absolute bottom-0 -left-32 w-96 h-96 bg-orange-100 rounded-full opacity-40 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center bg-amber-100 text-amber-800 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-amber-200 tracking-wide uppercase">
              Built by nostalgic, middle aged dads outside of Philly
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-stone-900 mb-5 leading-[1.05] tracking-tight">
              Make the house<br />
              <span className="text-[#C4531A]">ring ring</span><br />
              again.
            </h1>
            <p className="text-stone-600 text-xl mb-3 leading-relaxed font-medium">
              A safe, screen-free home phone for kids.
            </p>
            <p className="text-stone-500 text-lg mb-10 leading-relaxed max-w-lg">
              Kids calling each other again. No apps. No scrolling. No strangers. No spam. Just talking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => router.push('/buy')}
                className="px-8 py-4 bg-[#C4531A] text-white text-base font-bold rounded-full hover:bg-[#a84313] transition shadow-lg"
              >
                Join the Club 🔔
              </button>
              <button
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-stone-700 text-base font-semibold rounded-full hover:bg-stone-50 transition border border-stone-200 shadow-sm"
              >
                How it works →
              </button>
            </div>
            <p className="text-stone-400 text-sm italic">Remember calling a friend after school? We're bringing that back. Plans start at $0/month.</p>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-stone-100">
              <img
                src="/hero_split.png"
                alt="A child using a home phone"
                className="w-full object-cover"
                style={{ maxHeight: '500px', objectPosition: 'top' }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* Beat 2 — 5-Second Explainer */}
      <section id="how" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C4531A] font-semibold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 mt-3 mb-4 leading-tight">A home phone. Reimagined.</h2>
            <p className="text-stone-500 text-lg max-w-md mx-auto">Just plug it in. That's it.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                icon: '🔌',
                title: 'Plug it in',
                body: 'The small Ring Ring Bridge connects to your router or mesh. It arrives pre-configured before it ships.',
                color: 'bg-amber-50 border-amber-100',
                numColor: 'text-amber-500',
              },
              {
                num: '02',
                icon: '👨‍👩‍👧',
                title: 'Set your circle',
                body: 'Only numbers you approve can call or be called. Everyone else is blocked.',
                color: 'bg-teal-50 border-teal-100',
                numColor: 'text-teal-600',
              },
              {
                num: '03',
                icon: '📞',
                title: 'Let them call / answer',
                body: 'Your child picks up the phone and calls their friends.',
                color: 'bg-orange-50 border-orange-100',
                numColor: 'text-[#C4531A]',
              },
            ].map((item) => (
              <div key={item.num} className={`rounded-3xl p-8 border-2 ${item.color} hover:shadow-lg transition`}>
                <div className={`text-xs font-black tracking-widest mb-4 ${item.numColor}`}>{item.num}</div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-black text-stone-900 mb-3">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beat 3 — The Wedge */}
      <section id="story" className="py-24 px-6 bg-[#FAF7F2]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C4531A] font-semibold text-sm uppercase tracking-widest">The Catch</span>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 mt-3 mb-4 leading-tight">This isn&apos;t really about a phone.</h2>
            <p className="text-stone-600 text-xl leading-relaxed max-w-2xl mx-auto mb-2">
              A corded phone stays in the house, introducing natural, physical boundaries that restore the home as a sanctuary.
            </p>
            <p className="text-stone-500 text-lg leading-relaxed max-w-2xl mx-auto mb-2">
              Our kids learn to have a conversation without having a face or screen attached, which leads them to listen deeper, pay attention to each other, and ask questions.
            </p>
            <p className="text-stone-500 text-lg leading-relaxed max-w-2xl mx-auto mb-2">
              It gives slightly older kids independence without the pressure of texting, apps, or late-night scrolling.
            </p>
            <p className="text-stone-500 text-lg leading-relaxed max-w-2xl mx-auto mb-2">
              We know they&apos;ll have a smartphone eventually. We&apos;re just helping families start with something simpler.
            </p>
            <p className="text-stone-400 text-base italic">Also, it doesn&apos;t follow them into the bathroom.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '💬',
                title: 'Real Conversation',
                body: "The joy and independence of a focused call.",
                bg: 'bg-amber-50 border-amber-100',
              },
              {
                icon: '🎯',
                title: 'Single-Tasking',
                body: 'Talking becomes the activity, not something happening alongside scrolling.',
                bg: 'bg-teal-50 border-teal-100',
              },
              {
                icon: '📴',
                title: 'A Clear End',
                body: 'When the handset goes down, the conversation is over.',
                bg: 'bg-orange-50 border-orange-100',
              },
            ].map((card) => (
              <div key={card.title} className={`rounded-3xl p-8 border-2 ${card.bg}`}>
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-black text-stone-900 mb-2">{card.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-stone-400 text-sm italic mt-8">(Can you tell one of our spouses is a therapist?)</p>
        </div>
      </section>

      {/* Beat 4 — The Moment Story */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="space-y-6 text-stone-800 text-2xl md:text-3xl font-black leading-relaxed mb-12">
            <p>It&apos;s 4:30pm.</p>
            <p>Homework is done.</p>
            <p>Your child picks up the phone</p>
            <p>and calls their friend</p>
            <p>to coordinate tomorrow&apos;s outfit.</p>
          </div>
          <div className="mt-12 space-y-4 text-stone-400 text-lg font-medium">
            <p>No texting.</p>
            <p>No scrolling.</p>
            <p>Just talking.</p>
          </div>
          <p className="mt-12 text-stone-500 text-base leading-relaxed max-w-md mx-auto italic">
            And yes, they might say "hi" and then forget what to say next. It's surprisingly endearing to watch them figure out their calling etiquette.
          </p>
        </div>
      </section>

      {/* Beat 5 — BYOP */}
      <section id="shop" className="py-24 px-6 bg-[#FAF7F2]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C4531A] font-semibold text-sm uppercase tracking-widest">Any Phone. One Ring Ring.</span>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 mt-3 mb-4 leading-tight">Any Phone. One Ring Ring Club.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-3xl p-10 border-2 border-stone-100 hover:border-amber-200 hover:shadow-xl transition text-center">
              <div className="text-5xl mb-5">🛍️</div>
              <h3 className="text-xl font-black text-stone-900 mb-3">Pick a modern classic.</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-6">Curated handsets ready to ring.</p>
              <button
                onClick={() => router.push('/buy')}
                className="px-6 py-3 bg-[#C4531A] text-white text-sm font-bold rounded-full hover:bg-[#a84313] transition"
              >
                Browse the Ring Ring Shop →
              </button>
            </div>
            <div className="bg-white rounded-3xl p-10 border-2 border-stone-100 hover:border-teal-200 hover:shadow-xl transition text-center">
              <div className="text-5xl mb-5">📦</div>
              <h3 className="text-xl font-black text-stone-900 mb-3">Bring your own phone.</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-6">A vintage rotary from your attic or a thrift store find.</p>
              <button
                onClick={() => router.push('/buy')}
                className="px-6 py-3 bg-stone-800 text-white text-sm font-bold rounded-full hover:bg-stone-700 transition"
              >
                Join the Club with your Phone →
              </button>
            </div>
          </div>
          <div className="text-center">
            <p className="text-stone-500 text-base">
              The <strong className="text-stone-800">Ring Ring Bridge</strong> makes any (working) analog phone work on our network.
            </p>
            <p className="text-stone-400 text-sm italic mt-1">Yes, even the hamburger one.</p>
          </div>
        </div>
      </section>

      {/* Beat 6 — Trust Zone / Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C4531A] font-semibold text-sm uppercase tracking-widest">You Stay in Control</span>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 mt-3 mb-4 leading-tight">Built for safety.<br />Designed for sanity.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '✅',
                title: 'Approved Contacts Only',
                body: 'You control the circle. Everyone else is politely blocked — automatically.',
                bg: 'bg-green-50 border-green-100',
              },
              {
                icon: '🔴',
                title: 'Digital Kill Switch',
                body: 'Take the phone offline instantly from your dashboard. Back on just as fast.',
                bg: 'bg-red-50 border-red-100',
              },
              {
                icon: '🌙',
                title: 'Quiet Hours',
                body: 'Schedule silence during homework, dinner, or bedtime. Automatically.',
                bg: 'bg-indigo-50 border-indigo-100',
              },
              {
                icon: '⏱️',
                title: 'Usage Caps',
                body: 'Set daily talk limits when needed — and override them on snow days.',
                bg: 'bg-amber-50 border-amber-100',
              },
              {
                icon: '⚡',
                title: 'Quick Dial Shortcuts',
                body: "For younger kids who haven't mastered dialing 10 digits yet. And for those who have, but need to call their bff asap.",
                bg: 'bg-orange-50 border-orange-100',
              },
              {
                icon: '🚨',
                title: 'Real E911',
                body: 'Enterprise-grade infrastructure routes calls directly to your local 911 dispatcher with your verified home address.',
                bg: 'bg-teal-50 border-teal-100',
              },
            ].map((feature) => (
              <div key={feature.title} className={`rounded-3xl p-8 border-2 ${feature.bg} hover:shadow-lg transition`}>
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-black text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{feature.body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Beat 7 — Pricing */}
      <section id="pricing" className="py-24 px-6 bg-[#FAF7F2]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <span className="text-[#C4531A] font-semibold text-sm uppercase tracking-widest">Simple, Accessible Pricing</span>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 mt-3 mb-4 leading-tight">No hidden fees. No contracts.</h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto mb-8">
              Calling another Ring Ring family is always free. Kind of like a group chat, except people actually talk.
            </p>
          </div>

          {/* Billing period toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center bg-stone-100 rounded-full p-1 gap-1">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  !annual ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  annual ? 'bg-[#C4531A] text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Annual{' '}<span className={annual ? 'text-orange-200' : 'text-[#C4531A]'}>Save 10%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-3xl p-8 border-2 border-stone-100 hover:border-stone-200 hover:shadow-lg transition">
              <div className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-2">Starter Plan</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-6xl font-black text-stone-900">$0</span>
                <span className="text-stone-400 text-sm mb-3">/month</span>
              </div>
              <p className="text-stone-500 text-sm mb-8">Unlimited calling to other Ring Ring Club members. Forever free.</p>
              <ul className="space-y-3 mb-8 text-sm text-stone-600">
                {['Unlimited Ring Ring → Ring Ring calls', 'Up to 5 approved contacts', 'Online/offline toggle', 'Quick dial shortcuts'].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/buy')}
                className="w-full py-3 bg-stone-800 text-white rounded-full font-bold text-sm hover:bg-stone-700 transition"
              >
                Get Started Free
              </button>
            </div>

            {/* Paid */}
            <div className="bg-[#C4531A] rounded-3xl p-8 border-2 border-[#C4531A] shadow-2xl">
              <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                Most Popular
              </div>
              <div className="text-sm font-bold text-orange-200 uppercase tracking-widest mb-2">Make It Ring Ring</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-6xl font-black text-white">{annual ? '$8.06' : '$8.95'}</span>
                <span className="text-orange-200 text-sm mb-3">/month</span>
              </div>
              {annual && <p className="text-orange-200 text-xs mb-2">Billed annually — save ~$11/year</p>}
              <p className="text-orange-100 text-sm mb-8">Unlimited inbound/outbound calls to any US number.</p>
              <ul className="space-y-3 mb-8 text-sm text-orange-50">
                {[
                  'Everything in Starter',
                  'Unlimited calls to any US number',
                  'Unlimited approved contacts',
                  'Quick dial slots',
                  'Quiet Hours scheduling',
                  'Digital Kill Switch',
                  'Optional daily usage cap',
                  'Real E911 with verified address',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/buy')}
                className="w-full py-3 bg-white text-[#C4531A] rounded-full font-bold text-sm hover:bg-orange-50 transition"
              >
                Join the Club 🔔
              </button>
            </div>
          </div>

          <div className="mt-10 bg-stone-50 rounded-3xl p-6 border border-stone-100 max-w-3xl mx-auto text-center">
            <p className="text-stone-500 text-sm leading-relaxed">
              <strong className="text-stone-800">Radical Transparency Note:</strong> No magic. No cloud buzzwords. Just a small adapter (we call it the Ring Ring Bridge) that allows a real phone to work safely today. It connects to your router. We pre-configure it before it ships.
            </p>
          </div>
        </div>
      </section>
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C4531A] font-semibold text-sm uppercase tracking-widest">What Families Are Saying</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            {[
              {
                quote: "She actually asks to call her friend after dinner now. I had no idea that was still something kids would do voluntarily.",
                name: 'The Murphys',
                location: 'Havertown, PA',
              },
              {
                quote: "Our son called his friend to plan their bike route for Saturday. He just... called. On a phone. Like a normal person.",
                name: 'The Garcias',
                location: 'Wayne, PA',
              },
              {
                quote: "It rang. She sprinted from the other end of the house to answer it. I honestly teared up a little.",
                name: 'The Williamses',
                location: 'Berwyn, PA',
              },
            ].map((t) => (
              <div key={t.name} className="bg-[#FAF7F2] rounded-3xl p-8 border border-stone-100 hover:shadow-lg transition">
                <div className="text-amber-400 text-lg mb-4">★★★★★</div>
                <p className="text-stone-700 text-base leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-black text-stone-900 text-sm">{t.name}</p>
                  <p className="text-stone-400 text-xs">{t.location}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center bg-stone-900 rounded-3xl p-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-96 h-96 bg-amber-400 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C4531A] rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                Ready to hear it<br />ring ring again?
              </h2>
              <p className="text-stone-400 text-lg mb-10 max-w-md mx-auto">
                Join families across the country bringing back real conversations, one phone call at a time.
              </p>
              <button
                onClick={() => router.push('/buy')}
                className="px-10 py-4 bg-[#C4531A] text-white text-base font-bold rounded-full hover:bg-[#a84313] transition shadow-2xl"
              >
                Join the Club 🔔
              </button>
              <p className="mt-5 text-stone-500 text-sm italic">Warning: May cause parents to learn more about their children&apos;s day.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Brand blurb */}
          <div className="mb-12">
            <div className="text-xl font-black text-white mb-3">Ring Ring</div>
            <p className="text-sm text-stone-500 leading-relaxed max-w-xs">The safe, screen-free home phone for kids. Built by parents, outside Philadelphia.</p>
            <p className="text-xs text-stone-600 mt-4">support@ringringphone.com</p>
          </div>

          {/* 3-column link grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-sm mb-12">
            {/* Column 1: The Club */}
            <div>
              <div className="text-white font-bold mb-4">The Club</div>
              <nav aria-label="The Club" className="space-y-2">
                <a href="https://ringringclub.com/our-story" className="block hover:text-white transition">Our Analog Story</a>
                <a href="https://ringringclub.com/how-it-works" className="block hover:text-white transition">How It Works</a>
                <a href="https://ringringclub.com/shop" className="block hover:text-white transition">The Shop</a>
                <a href="https://ringringclub.com/pricing" className="block hover:text-white transition">Pricing</a>
                <a href="https://ringringclub.com/community" className="block hover:text-white transition">Community</a>
              </nav>
            </div>

            {/* Column 2: Support */}
            <div>
              <div className="text-white font-bold mb-4">Support</div>
              <nav aria-label="Support" className="space-y-2">
                <a href="https://ringringclub.com/faq" className="block hover:text-white transition">FAQs</a>
                <a href="https://ringringclub.com/setup" className="block hover:text-white transition">Setup Guides</a>
                <a href="https://ringringclub.com/contact" className="block hover:text-white transition">Contact Us</a>
              </nav>
            </div>

            {/* Column 3: Account */}
            <div>
              <div className="text-white font-bold mb-4">Account</div>
              <nav aria-label="Account" className="space-y-2">
                <a href="https://ringringclub.com/login" className="block hover:text-white transition">Log In</a>
                <a href="https://ringringclub.com/Join" className="block hover:text-white transition">Sign Up</a>
                <a href="https://ringringclub.com/invite" className="block hover:text-white transition">Invite a Neighbor</a>
              </nav>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-600">
            <p>© 2026 Ring Ring. All rights reserved.</p>
            <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <a href="https://ringringclub.com/terms" className="hover:text-stone-400 transition">Terms of Service</a>
              <span aria-hidden="true">|</span>
              <a href="https://ringringclub.com/privacy" className="hover:text-stone-400 transition">Privacy Policy</a>
              <span aria-hidden="true">|</span>
              <a href="https://ringringclub.com/e911" className="hover:text-stone-400 transition">E911 Disclosure</a>
              <span aria-hidden="true">|</span>
              <a href="https://ringringclub.com/refunds" className="hover:text-stone-400 transition">Refund Policy</a>
            </nav>
          </div>
        </div>
      </footer>

    </div>
  );
}
