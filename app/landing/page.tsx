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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm py-4' : 'bg-amber-50 py-6'}`}>
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="text-2xl font-bold text-stone-800 tracking-tight">🔔 Ring Ring Club</div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-500">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-stone-800 transition">Features</button>
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-stone-800 transition">How It Works</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-stone-800 transition">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="text-stone-500 hover:text-stone-800 font-medium text-sm transition"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-5 py-2.5 bg-stone-800 text-white text-sm font-semibold rounded-lg hover:bg-stone-900 transition shadow-sm"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-8 overflow-hidden bg-amber-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-amber-100 rounded-full opacity-60 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-96 h-96 bg-orange-100 rounded-full opacity-40 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white text-stone-600 text-sm font-medium px-4 py-2 rounded-full mb-8 shadow-sm border border-stone-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Simple phones for screen-free families
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-stone-900 mb-6 leading-tight tracking-tight">
            A phone they'll love.<br />
            <span className="text-amber-600">Without the screen.</span>
          </h1>
          <p className="text-xl text-stone-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Give your kids the freedom to call home — without giving them a smartphone.
            You decide who they can reach. They get a real phone they can hold.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-10 py-4 bg-stone-800 text-white text-lg font-bold rounded-xl hover:bg-stone-900 transition shadow-lg"
            >
              Join the Club 🔔
            </button>
            <button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-10 py-4 bg-white text-stone-700 text-lg font-semibold rounded-xl hover:bg-stone-50 transition shadow border border-stone-200"
            >
              See How It Works →
            </button>
          </div>
          <p className="mt-6 text-stone-400 text-sm">No credit card required · Set up in minutes</p>
        </div>

        {/* Mock Dashboard */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-100">
            <div className="bg-stone-100 px-4 py-3 flex items-center gap-2 border-b border-stone-200">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-stone-400 text-center border border-stone-200">
                ringringclub.com/dashboard
              </div>
            </div>
            <div className="p-6 bg-amber-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-semibold text-stone-800">Emma's Phone</span>
                  </div>
                  <div className="space-y-2">
                    {['Mom', 'Dad', 'Grandma'].map((name) => (
                      <div key={name} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-stone-600">{name}</span>
                        <span className="text-xs text-green-600 font-medium">✓ Approved</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-semibold text-stone-800">Jake's Phone</span>
                  </div>
                  <div className="space-y-2">
                    {['Mom', 'Coach Tim', 'Grandpa'].map((name) => (
                      <div key={name} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-stone-600">{name}</span>
                        <span className="text-xs text-green-600 font-medium">✓ Approved</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-white border-y border-stone-100">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-stone-400 text-sm font-medium uppercase tracking-widest mb-6">Trusted by families across America</p>
          <div className="flex flex-wrap items-center justify-center gap-12 text-stone-300 font-bold text-lg">
            {['The Johnsons', 'Smith Family', 'The Garcias', 'The Williams', 'The Martins'].map((name) => (
              <span key={name} className="hover:text-stone-400 transition cursor-default">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-28 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-amber-600 font-semibold text-sm uppercase tracking-widest">The Problem</span>
              <h2 className="text-4xl font-bold text-stone-900 mt-2 mb-6 leading-tight">
                Kids need to call home.<br />They don't need a smartphone.
              </h2>
              <p className="text-stone-500 text-lg leading-relaxed mb-6">
                Most parents feel stuck — give your kid a smartphone and suddenly they have access to everything. But not giving them one means they can't reach you when they need to.
              </p>
              <p className="text-stone-500 text-lg leading-relaxed">
                Ring Ring Club gives your child a <strong className="text-stone-800">real phone experience</strong> — without the internet, apps, or strangers. Just the people you approve.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { emoji: '📵', label: 'No internet access' },
                { emoji: '🚫', label: 'No social media' },
                { emoji: '👪', label: 'Family-approved only' },
                { emoji: '📞', label: 'Real phone calls' },
                { emoji: '🏠', label: 'Works at home' },
                { emoji: '✅', label: 'Parent controlled' },
              ].map((item) => (
                <div key={item.label} className="bg-amber-50 rounded-xl p-5 text-center border border-amber-100 hover:border-amber-300 hover:shadow-md transition">
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <p className="text-sm font-semibold text-stone-700">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-8 bg-amber-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-600 font-semibold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2 mb-4">Built for families, not tech experts</h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">Everything you need. Nothing you don't.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📋', title: 'Approved Contacts', description: 'Only the people you add can call in or be called. Everyone else gets a polite block — automatically.', color: 'bg-amber-100 text-amber-700' },
              { icon: '📞', title: 'Any Analog Phone', description: 'Works with any standard home phone. Plug into our adapter and you\'re live in minutes. No tech skills needed.', color: 'bg-green-100 text-green-700' },
              { icon: '⚡', title: 'Quick Dial', description: 'Press 1 for Mom, Press 2 for Dad. Assign speed dial slots for easy one-button calling.', color: 'bg-sky-100 text-sky-700' },
              { icon: '🔴', title: 'Instant On/Off', description: 'Take any phone offline in seconds. No calls in or out until you switch it back on.', color: 'bg-red-100 text-red-600' },
              { icon: '💻', title: 'Manage From Anywhere', description: 'Add contacts, check status, and control every phone from any browser — at home or on the go.', color: 'bg-purple-100 text-purple-600' },
              { icon: '🔒', title: 'Private & Secure', description: 'Your account is completely private. Only you can see your devices and contacts. Always.', color: 'bg-stone-100 text-stone-600' },
            ].map((feature) => (
              <div key={feature.title} className="group p-8 rounded-2xl border border-stone-100 hover:border-amber-300 hover:shadow-xl transition-all duration-300 bg-white">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">{feature.title}</h3>
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
            <span className="text-amber-600 font-semibold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2 mb-4">Ready in three simple steps</h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">No technical experience required. If you can plug in a phone, you're all set.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Plug in your phone', description: 'Connect any analog home phone to our pre-configured adapter. It arrives ready to go — no setup on the hardware side.', icon: '🔌' },
              { step: '02', title: 'Add approved contacts', description: 'Log in to your Ring Ring Club dashboard and add the family members or trusted contacts you want to allow. Just a name and number.', icon: '👨‍👩‍👧' },
              { step: '03', title: 'Let them ring!', description: "Your child's phone is live. They can call and receive calls from approved contacts only. You stay in control — always.", icon: '🔔' },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-amber-200 to-transparent z-0" />
                )}
                <div className="relative bg-amber-50 rounded-2xl p-8 border border-amber-100 hover:shadow-lg hover:border-amber-300 transition">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <div className="text-amber-600 font-black text-sm mb-2 tracking-widest">{item.step}</div>
                  <h3 className="text-xl font-bold text-stone-900 mb-3">{item.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 px-8 bg-amber-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-600 font-semibold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl font-bold text-stone-900 mt-2 mb-4">What families are saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "My daughter can call me after school without me worrying about what else she's doing on a phone. It's been a game changer for our family.", name: 'Sarah M.', location: 'Ohio' },
              { quote: "We got rid of the kids' iPads and replaced them with Ring Ring Club phones. The house is so much calmer now. Highly recommend.", name: 'David T.', location: 'Texas' },
              { quote: "My son has anxiety and having a simple phone with only trusted contacts has made him feel so much safer. Thank you for building this.", name: 'Jennifer R.', location: 'Georgia' },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 border border-stone-100 hover:shadow-lg transition">
                <div className="text-amber-400 text-2xl mb-4">★★★★★</div>
                <p className="text-stone-600 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-stone-800 text-sm">{t.name}</p>
                  <p className="text-stone-400 text-xs">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-600 font-semibold text-sm uppercase tracking-widest">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mt-2 mb-4">Simple, honest pricing</h2>
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
                features: ['Unlimited devices', 'Unlimited contacts', 'Quick dial slots', 'Call history', 'Priority support'],
                cta: 'Join the Club 🔔',
                highlight: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 transition ${
                  plan.highlight
                    ? 'border-amber-400 bg-stone-800 text-white shadow-2xl scale-105'
                    : 'border-stone-200 bg-white hover:border-amber-300 hover:shadow-lg'
                }`}
              >
                {plan.highlight && (
                  <div className="inline-block bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-stone-400' : 'text-stone-400'}`}>{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-5xl font-extrabold ${plan.highlight ? 'text-white' : 'text-stone-900'}`}>{plan.price}</span>
                  <span className={`text-sm mb-2 ${plan.highlight ? 'text-stone-400' : 'text-stone-400'}`}>/{plan.period}</span>
                </div>
                <p className={`text-sm mb-8 ${plan.highlight ? 'text-stone-400' : 'text-stone-500'}`}>{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${plan.highlight ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>✓</span>
                      <span className={plan.highlight ? 'text-stone-300' : 'text-stone-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/login')}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition ${
                    plan.highlight
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
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
      <section className="py-28 px-8 bg-amber-50 relative overflow-hidden border-t border-amber-100">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🔔</div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-stone-900 mb-4">
            Give your kids a phone.<br />Keep their childhood intact.
          </h2>
          <p className="text-stone-500 text-lg mb-10 max-w-xl mx-auto">
            Join families across America who are choosing connection over screens with Ring Ring Club.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-12 py-5 bg-stone-800 text-white text-lg font-extrabold rounded-xl hover:bg-stone-900 transition shadow-xl"
          >
            Join Ring Ring Club 🔔
          </button>
          <p className="mt-4 text-stone-400 text-sm">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-800 text-stone-400 py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
            <div>
              <div className="text-2xl font-bold text-white mb-2">🔔 Ring Ring Club</div>
              <p className="text-sm text-stone-400 max-w-xs">Simple phones for screen-free families. Built with love for American homes.</p>
            </div>
            <div className="flex gap-16 text-sm">
              <div>
                <div className="text-white font-semibold mb-4">Product</div>
                <div className="space-y-2">
                  <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-white transition">Features</button>
                  <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-white transition">Pricing</button>
                  <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-white transition">How It Works</button>
                </div>
              </div>
              <div>
                <div className="text-white font-semibold mb-4">Account</div>
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
