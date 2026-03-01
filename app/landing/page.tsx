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
    <div className="min-h-screen bg-white font-sans">

      {/* Sticky Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="text-2xl font-bold text-rose-500 tracking-tight">🔔 Ring Ring Club</div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-rose-500 transition">Features</button>
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-rose-500 transition">How It Works</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-rose-500 transition">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="text-gray-600 hover:text-gray-900 font-medium text-sm transition"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-5 py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-lg hover:bg-rose-600 transition shadow-sm"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-8 overflow-hidden bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full mb-8 backdrop-blur-sm border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Now available — BYOD analog phone support
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            The phone club<br />
            <span className="text-rose-200">your family deserves.</span>
          </h1>
          <p className="text-xl text-rose-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Plug in any analog phone. Manage exactly who can call in and out.
            No smartphones. No distractions. Just the calls that matter most.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-10 py-4 bg-white text-rose-500 text-lg font-bold rounded-xl hover:bg-rose-50 transition shadow-xl"
            >
              Join the Club 🔔
            </button>
            <button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-10 py-4 bg-white/10 text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition border border-white/20 backdrop-blur-sm"
            >
              See How It Works →
            </button>
          </div>
          <p className="mt-6 text-rose-200 text-sm">No credit card required · Set up in minutes</p>
        </div>

        {/* Mock Dashboard */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-gray-400 text-center">
                ringringclub.com/dashboard
              </div>
            </div>
            <div className="p-6 bg-gradient-to-br from-rose-50 to-pink-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-semibold text-gray-800">Kid's Room Phone</span>
                  </div>
                  <div className="space-y-2">
                    {['Mom', 'Dad', 'Grandma'].map((name) => (
                      <div key={name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-600">{name}</span>
                        <span className="text-xs text-green-600 font-medium">Approved ✓</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-semibold text-gray-800">Living Room Phone</span>
                  </div>
                  <div className="space-y-2">
                    {['Doctor', 'School', 'Grandpa'].map((name) => (
                      <div key={name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-600">{name}</span>
                        <span className="text-xs text-green-600 font-medium">Approved ✓</span>
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
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-6">Trusted by families everywhere</p>
          <div className="flex flex-wrap items-center justify-center gap-12 text-gray-300 font-bold text-xl">
            {['The Johnsons', 'Smith Family', 'ElderCare Co.', 'KidSafe Homes', 'The Garcias'].map((brand) => (
              <span key={brand} className="hover:text-gray-400 transition cursor-default">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">Everything your club needs</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Simple, powerful tools to manage every phone in your home.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📋', title: 'Approved Contacts', description: 'Control exactly who can call in and out. Only approved contacts get through — everyone else is blocked automatically.', color: 'bg-rose-50 text-rose-500' },
              { icon: '📞', title: 'Any Analog Phone', description: 'Works with any standard analog phone. Plug into our adapter and you\'re live in minutes. No tech skills needed.', color: 'bg-green-50 text-green-600' },
              { icon: '⚡', title: 'Quick Dial', description: 'Assign speed dial slots so loved ones can reach anyone with a single button press — no dialing needed.', color: 'bg-yellow-50 text-yellow-600' },
              { icon: '🔴', title: 'Instant On/Off', description: 'Take any device offline instantly. No calls in or out until you switch it back on from your dashboard.', color: 'bg-red-50 text-red-500' },
              { icon: '📱', title: 'Manage Anywhere', description: 'Update contacts, check device status, and manage everything from any browser on any device.', color: 'bg-purple-50 text-purple-600' },
              { icon: '🔒', title: 'Private & Secure', description: 'Each account is completely isolated. Your devices and contacts are only ever visible to you.', color: 'bg-indigo-50 text-indigo-600' },
            ].map((feature) => (
              <div key={feature.title} className="group p-8 rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-xl transition-all duration-300 bg-white">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-28 px-8 bg-gradient-to-br from-gray-50 to-rose-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">Up and running in minutes</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">No technical experience required. If you can plug in a phone, you're good to go.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Plug in your phone', description: 'Connect any analog phone to our pre-configured adapter. It comes ready to go — no setup needed on the hardware side.', icon: '🔌' },
              { step: '02', title: 'Add approved contacts', description: 'Log into your Ring Ring Club dashboard and add the contacts you want to allow. Name and phone number — that\'s it.', icon: '👥' },
              { step: '03', title: 'Start ringing!', description: 'Your phone is live. Only approved contacts can get through. Everyone else hears a polite message and can\'t connect.', icon: '🔔' },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-rose-200 to-transparent z-0" />
                )}
                <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <div className="text-rose-500 font-black text-sm mb-2 tracking-widest">{item.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-rose-500 font-semibold text-sm uppercase tracking-widest">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">No hidden fees. No contracts. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                period: 'forever',
                description: 'Perfect for trying it out',
                features: ['1 device', 'Up to 5 contacts', 'Online/offline toggle', 'Email support'],
                cta: 'Join Free',
                highlight: false,
              },
              {
                name: 'Club Member',
                price: '$9.99',
                period: 'per month',
                description: 'For the whole family',
                features: ['Unlimited devices', 'Unlimited contacts', 'Quick dial slots', 'Call history', 'Priority support'],
                cta: 'Join the Club 🔔',
                highlight: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 transition ${
                  plan.highlight
                    ? 'border-rose-500 bg-rose-500 text-white shadow-2xl scale-105'
                    : 'border-gray-200 bg-white hover:border-rose-200 hover:shadow-lg'
                }`}
              >
                {plan.highlight && (
                  <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-rose-100' : 'text-gray-500'}`}>{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-5xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm mb-2 ${plan.highlight ? 'text-rose-200' : 'text-gray-400'}`}>/{plan.period}</span>
                </div>
                <p className={`text-sm mb-8 ${plan.highlight ? 'text-rose-100' : 'text-gray-500'}`}>{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${plan.highlight ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-500'}`}>✓</span>
                      <span className={plan.highlight ? 'text-rose-50' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/login')}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition ${
                    plan.highlight
                      ? 'bg-white text-rose-500 hover:bg-rose-50'
                      : 'bg-rose-500 text-white hover:bg-rose-600'
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
      <section className="py-28 px-8 bg-gradient-to-br from-rose-500 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🔔</div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Ready to join the club?
          </h2>
          <p className="text-rose-100 text-lg mb-10 max-w-xl mx-auto">
            Join families everywhere who trust Ring Ring Club to keep their phones simple, safe, and in their control.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-12 py-5 bg-white text-rose-500 text-lg font-extrabold rounded-xl hover:bg-rose-50 transition shadow-2xl"
          >
            Join Ring Ring Club 🔔
          </button>
          <p className="mt-4 text-rose-200 text-sm">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-12">
            <div>
              <div className="text-2xl font-bold text-white mb-2">🔔 Ring Ring Club</div>
              <p className="text-sm text-gray-500 max-w-xs">Simple phones. Total control. Built for families who want less noise and more connection.</p>
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
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
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
