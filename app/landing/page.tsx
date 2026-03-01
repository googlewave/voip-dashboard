'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 font-sans">

      {/* Sticky Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-stone-800 shadow-lg py-4' : 'bg-stone-800 py-6'}`}>
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="text-2xl font-extrabold text-white tracking-tight">🔔 Ring Ring Club</div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-300">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition">Features</button>
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition">How It Works</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/login')} className="text-stone-300 hover:text-white font-medium text-sm transition">Sign In</button>
            <button onClick={() => router.push('/login')} className="px-5 py-2.5 bg-amber-400 text-stone-900 text-sm font-extrabold rounded-lg hover:bg-amber-300 transition shadow-md">
              Join the Club 🔔
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-0 bg-stone-800 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-stone-700 rounded-full opacity-50 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-96 h-96 bg-stone-600 rounded-full opacity-40 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
          {/* Left: Copy */}
          <div className="pb-20">
            <div className="inline-flex items-center gap-2 bg-white/10 text-stone-200 text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-white/20">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              Hyper-local. Human. Connected.
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              The phone club your<br />
              <span className="text-amber-400">friends & family deserve.</span>
            </h1>
            <p className="text-stone-300 text-xl mb-10 leading-relaxed max-w-lg">
              Ring Ring Club is the simple, safe way to stay close with the people who matter most — your real circle. No algorithms. No strangers. Just your people.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => router.push('/login')}
                className="w-full sm:w-auto px-10 py-4 bg-amber-400 text-stone-900 text-lg font-extrabold rounded-xl hover:bg-amber-300 transition shadow-xl"
              >
                Join the Club 🔔
              </button>
              <button
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-4 bg-white/10 text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition border border-white/20"
              >
                See How It Works →
              </button>
            </div>
            <p className="mt-6 text-stone-400 text-sm">No credit card required · Set up in minutes · Share with your circle</p>
          </div>

          {/* Right: Hero Image */}
          <div className="relative flex items-end justify-center">
            <div className="w-full rounded-t-3xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                src="/hero_split.png"
                alt="Friends and family connecting on Ring Ring Club"
                className="w-full object-cover object-top"
                style={{ maxHeight: '420px' }}
              />
            </div>
            {/* Floating badge bottom left */}
            <div className="absolute bottom-8 -left-4 bg-white rounded-2xl shadow-2xl p-4 border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">📞</div>
                <div>
                  <p className="text-xs text-stone-400">Just now</p>
                  <p className="text-sm font-bold text-stone-800">Emma called Grandma ✓</p>
                </div>
              </div>
            </div>
            {/* Floating badge top LEFT (moved away from grandma) */}
            <div className="absolute top-8 left-4 bg-white rounded-2xl shadow-2xl p-4 border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl">🔒</div>
                <div>
                  <p className="text-xs text-stone-400">Always</p>
                  <p className="text-sm font-bold text-stone-800">Your circle only</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-10 bg-stone-900 border-b border-stone-700">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-stone-400 text-sm font-semibold uppercase tracking-widest mb-6">Families & friend groups sharing the club love</p>
          <div className="flex flex-wrap items-center justify-center gap-10 text-stone-600 font-bold text-base">
            {['The Johnsons', 'Smith Family', 'The Garcias', 'The Williams', 'The Nguyens', 'Team Rodriguez'].map((name) => (
              <span key={name} className="hover:text-stone-300 transition cursor-default">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Hyper Local Network Section */}
      <section className="py-28 px-8 bg-amber-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-amber-700 font-semibold text-sm uppercase tracking-widest">Your Circle. Your Club.</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-stone-900 mt-3 mb-6 leading-tight">
              Built for your real, local network — not the whole internet.
            </h2>
            <p className="text-stone-500 text-lg leading-relaxed mb-6">
              Ring Ring Club is designed around hyper-local trust. Your family, your neighbors, your close friends — the people you actually know. Invite them in, share your club, and keep the connection real.
            </p>
            <p className="text-stone-500 text-lg leading-relaxed mb-10">
              When someone loves Ring Ring Club, they share it with their circle — and that circle shares it with theirs. That's how real communities grow. Word by word. Family by family.
            </p>
            <div className="flex flex-wrap gap-4">
              {['Share with neighbors', 'Invite your family', 'Grow your circle', 'Keep it local'].map((tag) => (
                <span key={tag} className="px-4 py-2 bg-amber-100 text-amber-800 font-semibold text-sm rounded-full border border-amber-200">{tag}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🏘️', title: 'Hyper-Local First', description: 'Start with who you know. Your block, your family, your crew.' },
              { icon: '🤝', title: 'Share the Club', description: 'Invite friends and family to join. The more the merrier — safely.' },
              { icon: '📣', title: 'Word of Mouth', description: 'Great things spread naturally. Real people telling real people.' },
              { icon: '💛', title: 'Built on Trust', description: 'Only people you approve can be part of your circle. Always.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-amber-100 hover:shadow-lg hover:border-amber-300 transition">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-stone-900 mb-1 text-base">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-28 px-8 bg-stone-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-400 font-semibold text-sm uppercase tracking-widest">Who It's For</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-2 mb-4">Made for the moments that matter</h2>
            <p className="text-stone-300 text-lg max-w-xl mx-auto">No matter where your people are, Ring Ring Club keeps you close.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '👧',
                title: 'Screen-Free Kids',
                description: "Give your child the independence to call friends and family — without handing them a smartphone. You control every contact. They get a real phone they can hold.",
                color: 'bg-amber-400 text-stone-900',
              },
              {
                icon: '👵',
                title: 'Grandparents & Elders',
                description: "A simple, familiar phone for grandparents who find smartphones confusing. One button to reach the grandkids. No apps. No passwords. Just love.",
                color: 'bg-green-300 text-green-900',
              },
              {
                icon: '🌍',
                title: 'International Families',
                description: "Keep family ties strong across borders. Whether your loved ones are in Mexico, the Philippines, or Nigeria — staying in touch has never been simpler.",
                color: 'bg-rose-300 text-rose-900',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/10 hover:bg-white/20 transition">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5 ${item.color}`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-extrabold text-white mb-3">{item.title}</h3>
                <p className="text-stone-300 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-8 bg-amber-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-700 font-semibold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-stone-900 mt-2 mb-4">Built for real people, not tech experts</h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">Everything you need. Nothing you don't.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📋', title: 'Approved Contacts', description: 'Only the people you add can call in or be called. Everyone else is politely blocked — automatically, every time.', color: 'bg-amber-100 text-amber-700' },
              { icon: '📞', title: 'Any Analog Phone', description: "Works with any standard home phone. Plug into our adapter and you're live in minutes. No tech skills needed.", color: 'bg-green-100 text-green-700' },
              { icon: '⚡', title: 'Quick Dial', description: 'Press 1 for Mom, Press 2 for Grandma. Assign speed dial slots so calling is always just one button away.', color: 'bg-yellow-100 text-yellow-700' },
              { icon: '🔴', title: 'Instant On/Off', description: "Take any phone offline in seconds from your dashboard. Turn it back on whenever you're ready.", color: 'bg-red-100 text-red-600' },
              { icon: '🌍', title: 'International Calling', description: 'Keep family ties strong no matter where they live. Call loved ones abroad as easily as calling next door.', color: 'bg-rose-100 text-rose-600' },
              { icon: '🔒', title: 'Private & Secure', description: 'Your account is completely private. Only you can see your devices and contacts. Always and forever.', color: 'bg-stone-100 text-stone-600' },
            ].map((feature) => (
              <div key={feature.title} className="group p-8 rounded-2xl border-2 border-amber-100 hover:border-amber-300 hover:shadow-xl transition-all duration-300 bg-white">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-extrabold text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-28 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-700 font-semibold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-stone-900 mt-2 mb-4">Ready in three simple steps</h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">No technical experience required. If you can plug in a phone, you're all set.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Plug in your phone', description: 'Connect any analog home phone to our pre-configured adapter. It arrives ready to go — no setup needed on your end.', icon: '🔌', color: 'bg-stone-800' },
              { step: '02', title: 'Add your circle', description: 'Log in to your Ring Ring Club dashboard and add the friends and family members you want to allow. Just a name and number.', icon: '👨‍👩‍👧', color: 'bg-amber-400' },
              { step: '03', title: 'Share & let them ring!', description: "Your phone is live. Share Ring Ring Club with your circle so they can join too. Approved contacts call freely — everyone else is blocked.", icon: '🔔', color: 'bg-green-500' },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-amber-200 to-transparent z-0" />
                )}
                <div className="relative bg-amber-50 rounded-2xl p-8 border-2 border-amber-100 hover:border-amber-300 hover:shadow-xl transition">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5 ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="text-amber-600 font-black text-sm mb-2 tracking-widest">{item.step}</div>
                  <h3 className="text-xl font-extrabold text-stone-900 mb-3">{item.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 px-8 bg-stone-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-400 font-semibold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl font-extrabold text-white mt-2 mb-4">What families are saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "My daughter can call her grandparents and best friend after school without me worrying about screens. It's been a game changer for our family.", name: 'Sarah M.', location: 'Ohio' },
              { quote: "My parents are in the Philippines. With Ring Ring Club they have a real phone that only calls our family. No confusion, no wrong numbers — just us.", name: 'David T.', location: 'Texas' },
              { quote: "My mom has dementia and gets confused by smartphones. This simple phone with only our numbers has been such a blessing for our whole family.", name: 'Jennifer R.', location: 'Georgia' },
            ].map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/10 hover:bg-white/20 transition">
                <div className="text-amber-400 text-2xl mb-4">★★★★★</div>
                <p className="text-stone-200 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-extrabold text-white text-sm">{t.name}</p>
                  <p className="text-stone-400 text-xs">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-8 bg-amber-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-700 font-semibold text-sm uppercase tracking-widest">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-stone-900 mt-2 mb-4">Simple, honest pricing</h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">No hidden fees. No contracts. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                period: 'forever',
                description: 'Perfect for trying it out',
                features: ['1 device', 'Up to 5 contacts', 'Online/offline toggle', 'Email support'],
                cta: 'Get Started Free',
                highlight: false,
              },
              {
                name: 'Family Plan',
                price: '$9.99',
                period: 'per month',
                description: 'For the whole household',
                features: ['Unlimited devices', 'Unlimited contacts', 'Quick dial slots', 'International calling', 'Priority support'],
                cta: 'Join the Club 🔔',
                highlight: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 transition ${
                  plan.highlight
                    ? 'border-amber-400 bg-stone-800 text-white shadow-2xl scale-105'
                    : 'border-amber-100 bg-white hover:border-amber-300 hover:shadow-lg'
                }`}
              >
                {plan.highlight && (
                  <div className="inline-block bg-amber-400/20 text-amber-300 text-xs font-extrabold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-stone-300' : 'text-stone-400'}`}>{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-5xl font-extrabold ${plan.highlight ? 'text-white' : 'text-stone-900'}`}>{plan.price}</span>
                  <span className={`text-sm mb-2 ${plan.highlight ? 'text-stone-300' : 'text-stone-400'}`}>/{plan.period}</span>
                </div>
                <p className={`text-sm mb-8 ${plan.highlight ? 'text-stone-300' : 'text-stone-500'}`}>{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${plan.highlight ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>✓</span>
                      <span className={plan.highlight ? 'text-stone-300' : 'text-stone-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/login')}
                  className={`w-full py-3 rounded-xl font-extrabold text-sm transition ${
                    plan.highlight
                      ? 'bg-amber-400 text-stone-900 hover:bg-amber-300'
                      : 'bg-stone-800 text-white hover:bg-stone-900'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-8 bg-stone-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-stone-700 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-600 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🔔</div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            The phone club your<br />
            <span className="text-amber-400">friends & family deserve.</span>
          </h2>
          <p className="text-stone-300 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of families and friend groups staying close the simple, safe, and human way. Share the club. Grow your circle.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-12 py-5 bg-amber-400 text-stone-900 text-lg font-extrabold rounded-xl hover:bg-amber-300 transition shadow-2xl"
          >
            Join Ring Ring Club 🔔
          </button>
          <p className="mt-4 text-stone-400 text-sm">No credit card required · Cancel anytime · Share with your circle</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
            <div>
              <div className="text-2xl font-extrabold text-white mb-2">🔔 Ring Ring Club</div>
              <p className="text-sm text-stone-400 max-w-xs">The phone club your friends and family deserve. Simple, safe, and human.</p>
            </div>
            <div className="flex gap-16 text-sm">
              <div>
                <div className="text-white font-extrabold mb-4">Product</div>
                <div className="space-y-2">
                  <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-white transition">Features</button>
                  <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-white transition">Pricing</button>
                  <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-white transition">How It Works</button>
                </div>
              </div>
              <div>
                <div className="text-white font-extrabold mb-4">Account</div>
                <div className="space-y-2">
                  <button onClick={() => router.push('/login')} className="block hover:text-white transition">Sign In</button>
                  <button onClick={() => router.push('/login')} className="block hover:text-white transition">Sign Up</button>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-stone-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© 2026 Ring Ring Club. All rights reserved.</p>
            <div className="flex gap-6">
              <button className="hover:text-white transition">Privacy Policy</button>
              <button className="hover:text-white transition">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
