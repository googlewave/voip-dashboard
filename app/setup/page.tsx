'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const paths = [
  {
    id: 'bridge',
    label: 'Path 1',
    icon: '🔌',
    title: 'The Bridge + Your Own Phone',
    subtitle: 'You have our Bridge and a vintage or modern analog phone you found in the wild.',
    steps: [
      {
        num: '01',
        name: 'The Internet Link',
        detail: 'Plug one end of the provided Ethernet cable into the <strong>Internet</strong> port on your Bridge. Plug the other end into an open port on your home router.',
      },
      {
        num: '02',
        name: 'The Analog Connection',
        detail: 'Take the cord from your own telephone and plug it into the <strong>Phone</strong> port on the Bridge. You should hear a satisfying click.',
      },
      {
        num: '03',
        name: 'Power Up',
        detail: 'Plug the power adapter into the Bridge and then into a wall outlet.',
      },
      {
        num: '04',
        name: 'Wait for the Glow',
        detail: 'The LED on the Bridge will blink <strong>amber</strong> while it "calls home" to Berwyn. Once it turns <strong>solid</strong>, pick up your handset.',
      },
      {
        num: '05',
        name: 'Listen',
        detail: 'Do you hear that? That\'s a 100% digital dial tone. You\'re ready for the Final Step below.',
      },
    ],
  },
  {
    id: 'bundle',
    label: 'Path 2',
    icon: '📦',
    title: 'The Analog Bundle (Bridge + Our Vintage Phone)',
    subtitle: 'You purchased a curated vintage phone and a Bridge together.',
    steps: [
      {
        num: '01',
        name: 'Connect the Pair',
        detail: 'Your vintage phone comes with a standard phone cord. Plug this into the <strong>Phone</strong> port on the Bridge.',
      },
      {
        num: '02',
        name: 'The Router Link',
        detail: 'Plug the Ethernet cable into the <strong>Internet</strong> port on the Bridge and an open port on your home router.',
      },
      {
        num: '03',
        name: 'Power On',
        detail: 'Connect the Bridge to power.',
      },
      {
        num: '04',
        name: 'The "Ring" Test',
        detail: 'While the Bridge is booting up (<strong>Solid Teal</strong> light), go to your Member Dashboard on a computer to register your address.',
      },
      {
        num: '05',
        name: 'Listen',
        detail: 'Pick up your curated handset. If you hear the dial tone, your "Modern Classic" is officially back in service.',
      },
    ],
  },
  {
    id: 'voip',
    label: 'Path 3',
    icon: '📡',
    title: 'The More Modern VoIP Phone',
    subtitle: 'You have a standalone IP phone that connects wirelessly.',
    steps: [
      {
        num: '01',
        name: 'Find the Perfect Spot',
        detail: 'This phone doesn\'t need to live next to your router. Find a central spot—the kitchen counter or a hallway nook—and plug it into a power outlet.',
      },
      {
        num: '02',
        name: 'The "One-Time" Screen',
        detail: 'This phone has a small screen for setup only. Follow the on-screen prompts to connect it to your home WiFi network. <em>(Note: screen setup instructions will be updated when we finalize the hardware.)</em>',
        updateRequired: true,
      },
      {
        num: '03',
        name: 'The Transformation',
        detail: 'Once connected, the screen will dim and show only the Ring Ring Club logo and the time.',
      },
      {
        num: '04',
        name: 'Go Screen-Free',
        detail: 'From now on, you don\'t need the screen. Just pick up the handset and dial.',
      },
    ],
  },
];

const activationSteps = [
  {
    num: '01',
    name: 'Log In',
    detail: 'Visit your Member Dashboard on any computer or phone.',
    cta: { label: 'Go to Dashboard', href: '/dashboard' },
  },
  {
    num: '02',
    name: 'Confirm Your 911 Address',
    detail: 'This is legally required to activate your 10-digit "Make It Ring Ring" number.',
    link: { label: 'See E911 Disclosure →', href: '/e911' },
  },
  {
    num: '03',
    name: 'Build Your Circle of Trust',
    detail: 'Add the names and numbers of Grandma, best friends, and neighbors.',
  },
  {
    num: '04',
    name: 'The Inaugural Call',
    detail: 'Dial a number from your Circle. When they pick up, tell them: "I\'m calling you from the past, but the audio quality is from the future."',
    isPoetic: true,
  },
];

export default function SetupPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('bridge');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const activePath = paths.find((p) => p.id === activeTab)!;

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
            <button className="text-stone-900 font-bold border-b-2 border-[#C4531A] pb-0.5">Setup Guides</button>
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
      <header className="pt-40 pb-14 px-6 text-center">
        <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Setup Guide</span>
        <h1 className="text-5xl md:text-6xl font-black text-stone-900 mt-3 mb-4 leading-tight tracking-tight">
          Let&apos;s Get the<br className="hidden md:block" /> House Ringing
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto">
          Follow the path below that matches your Ring Ring Club gear.
        </p>
      </header>

      <main className="pb-24 px-6">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Path Selector */}
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              {paths.map((path) => (
                <button
                  key={path.id}
                  onClick={() => setActiveTab(path.id)}
                  className={`flex-1 flex items-center gap-3 px-5 py-4 rounded-2xl border-2 text-left transition ${
                    activeTab === path.id
                      ? 'border-[#C4531A] bg-white shadow-sm'
                      : 'border-stone-100 bg-white/50 hover:border-stone-300'
                  }`}
                >
                  <span className="text-2xl">{path.icon}</span>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-widest ${activeTab === path.id ? 'text-[#C4531A]' : 'text-stone-400'}`}>
                      {path.label}
                    </p>
                    <p className={`text-sm font-bold leading-tight ${activeTab === path.id ? 'text-stone-900' : 'text-stone-500'}`}>
                      {path.title.split('(')[0].trim()}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Active Path Card */}
            <div className="bg-white border border-stone-100 rounded-3xl shadow-sm p-8 md:p-10">
              <div className="mb-6">
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">{activePath.label}</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-2">{activePath.title}</h2>
                <p className="text-stone-500 text-sm italic">{activePath.subtitle}</p>
              </div>

              <div className="space-y-5">
                {activePath.steps.map((step) => (
                  <div key={step.num} className={`flex items-start gap-5 p-5 rounded-2xl ${step.updateRequired ? 'bg-amber-50 border border-amber-100' : 'bg-stone-50'}`}>
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-stone-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-xs font-black text-stone-600">{step.num}</span>
                    </div>
                    <div className="pt-1.5">
                      <p className="font-black text-stone-900 text-sm mb-1">{step.name}</p>
                      <p
                        className={`text-sm leading-relaxed ${step.updateRequired ? 'text-amber-800' : 'text-stone-500'}`}
                        dangerouslySetInnerHTML={{ __html: step.detail }}
                      />
                      {step.updateRequired && (
                        <span className="inline-block mt-2 text-xs font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                          ⚠️ Update Required
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* The Final Step */}
          <div className="bg-[#1a4a3a] rounded-3xl p-8 md:p-10">
            <span className="text-amber-300 text-xs font-black uppercase tracking-widest">The Final Step</span>
            <h2 className="text-3xl font-black text-white mt-2 mb-2 leading-tight">Activation</h2>
            <p className="text-stone-300 text-sm mb-8">
              No matter which path you took, you need to do this once.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activationSteps.map((step) => (
                <div
                  key={step.num}
                  className={`rounded-2xl p-5 ${step.isPoetic ? 'bg-amber-900/30 border border-amber-700/30' : 'bg-white/10 border border-white/10'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-full bg-amber-300/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-300 text-xs font-black">{step.num}</span>
                    </div>
                    <p className="font-black text-white text-sm">{step.name}</p>
                  </div>
                  <p className={`text-sm leading-relaxed pl-10 ${step.isPoetic ? 'text-amber-200 italic' : 'text-stone-300'}`}>
                    {step.detail}
                  </p>
                  {step.cta && (
                    <button
                      onClick={() => router.push(step.cta!.href)}
                      className="ml-10 mt-3 px-4 py-2 bg-[#C4531A] text-white text-xs font-bold rounded-full hover:bg-[#a84313] transition"
                    >
                      {step.cta.label} →
                    </button>
                  )}
                  {step.link && (
                    <a href={step.link.href} className="block ml-10 mt-2 text-amber-300 text-xs hover:underline">
                      {step.link.label}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting Workshop Note */}
          <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-8">
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0">🔧</span>
              <div>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Troubleshooting</span>
                <h2 className="text-xl font-black text-stone-900 mt-1 mb-5">From the Workshop</h2>
                <div className="space-y-4">
                  {[
                    {
                      icon: '🔇',
                      q: 'No Dial Tone?',
                      a: 'Double-check that the Ethernet cable is pushed all the way in until it clicks.',
                    },
                    {
                      icon: '🔴',
                      q: 'Flashing Red Light?',
                      a: 'This usually means your router is being shy. Try restarting your router first, then unplug and replug the Bridge.',
                    },
                    {
                      icon: '💬',
                      q: 'Still Stuck?',
                      a: null,
                      links: [
                        { label: 'Check the FAQs', href: '/faq' },
                        { label: 'Send a Digital Dispatch to the workshop', href: '/contact' },
                      ],
                    },
                  ].map((item) => (
                    <div key={item.q} className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="font-black text-stone-900 text-sm">{item.q}</p>
                        {item.a && <p className="text-stone-600 text-sm leading-relaxed">{item.a}</p>}
                        {item.links && (
                          <p className="text-stone-600 text-sm leading-relaxed">
                            Don&apos;t sweat it.{' '}
                            {item.links.map((l, i) => (
                              <span key={l.href}>
                                <a href={l.href} className="text-[#C4531A] hover:underline font-medium">{l.label}</a>
                                {i < item.links!.length - 1 && ' or '}
                              </span>
                            ))}
                            {' '}and we&apos;ll help you figure it out.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
