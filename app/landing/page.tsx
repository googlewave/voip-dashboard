'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-blue-600">VoIP Dashboard</div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-600 hover:text-gray-900 font-medium transition"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-24 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Simple phones.<br />
          <span className="text-blue-600">Total control.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Plug in any analog phone and manage exactly who can call in and out.
          No smartphones. No distractions. Just calls.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 transition shadow-lg"
          >
            Get Started Free
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white text-gray-700 text-lg font-medium rounded-xl hover:bg-gray-50 transition shadow-lg"
          >
            Learn More
          </button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Everything you need
          </h2>
          <p className="text-center text-gray-500 mb-16 text-lg">
            Set up in minutes. No technical experience required.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '📋',
                title: 'Approved Contacts',
                description: 'Control exactly who can call in and out. Only approved contacts get through — everyone else is blocked.',
              },
              {
                icon: '📞',
                title: 'Any Analog Phone',
                description: 'Works with any standard analog phone. Plug into our adapter and you\'re ready to go in minutes.',
              },
              {
                icon: '⚡',
                title: 'Quick Dial',
                description: 'Assign speed dial slots so your loved ones can reach anyone with just one button press.',
              },
              {
                icon: '🔴',
                title: 'Online / Offline',
                description: 'Instantly take any device offline. No calls in or out until you turn it back on.',
              },
              {
                icon: '📱',
                title: 'Manage From Anywhere',
                description: 'Update contacts, check status, and manage all your devices from any browser.',
              },
              {
                icon: '🔒',
                title: 'Private & Secure',
                description: 'Each account is completely isolated. Your devices and contacts are only visible to you.',
              },
            ].map((feature) => (
              <div key={feature.title} className="p-8 rounded-xl border border-gray-100 hover:shadow-lg transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 max-w-6xl mx-auto px-8">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">How it works</h2>
        <p className="text-center text-gray-500 mb-16 text-lg">Up and running in 3 simple steps</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Plug in your phone', description: 'Connect any analog phone to our pre-configured Grandstream adapter.' },
            { step: '2', title: 'Add your contacts', description: 'Log in and add approved contacts for each device. Only they can call.' },
            { step: '3', title: "You're live", description: 'Your phone is ready. Make and receive calls instantly.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-6">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-24">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-blue-100 text-lg mb-10">
            Set up your first device in minutes. No credit card required.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-10 py-4 bg-white text-blue-600 text-lg font-bold rounded-xl hover:bg-blue-50 transition shadow-lg"
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="text-xl font-bold text-white">VoIP Dashboard</div>
          <p className="text-sm">© 2026 VoIP Dashboard. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
