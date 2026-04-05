'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function E911Page() {
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
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/login')} className="text-stone-500 hover:text-stone-800 font-medium text-sm transition">Sign In</button>
            <button onClick={() => router.push('/buy')} className="px-5 py-2.5 bg-[#C4531A] text-white text-sm font-bold rounded-full hover:bg-[#a84313] transition shadow-md">
              Join the Club 🔔
            </button>
          </div>
        </div>
      </nav>

      {/* Document */}
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-10 md:p-16">

            {/* Header */}
            <div className="mb-10 pb-10 border-b border-stone-100">
              <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Legal &amp; Safety</span>
              <h1 className="text-4xl md:text-5xl font-black text-stone-900 mt-3 mb-3 leading-tight">
                Emergency 911 (E911)<br />Advisory &amp; Disclosure
              </h1>
              <p className="text-stone-400 text-sm">Last Updated: March 31, 2026</p>
            </div>

            {/* Top callout */}
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-10">
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">🚨</span>
                <div>
                  <p className="font-black text-red-800 uppercase tracking-wide text-sm mb-2">
                    Important: Read Carefully
                  </p>
                  <p className="text-red-700 text-sm leading-relaxed font-semibold">
                    Your acknowledgment is required for service activation.
                  </p>
                  <p className="text-red-600 text-sm leading-relaxed mt-2">
                    This E911 Disclosure is provided by CP Impact LLC, a Pennsylvania limited liability company doing business as Ring Ring Club (&ldquo;Ring Ring Club,&rdquo; &ldquo;the Club,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). This document explains the critical differences between our VoIP-based emergency calling and traditional landline 911 services.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-12">

              {/* Section 1 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 1</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-5">Plan-Specific 911 Capabilities</h2>
                <p className="text-stone-600 text-base leading-relaxed mb-5">
                  The availability of 911 services depends on the specific service plan you select:
                </p>
                <div className="space-y-4">
                  <div className="bg-teal-50 border-2 border-teal-100 rounded-2xl p-6">
                    <p className="font-black text-stone-900 text-sm mb-2">
                      A. The &ldquo;Make It Ring Ring&rdquo; Plan (Paid Subscription)
                    </p>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      This plan assigns your hardware a full 10-digit North American Routing Plan phone number and allows calls to the &ldquo;outside world&rdquo; (the Public Switched Telephone Network). Per FCC regulations for interconnected VoIP providers, <strong className="text-stone-900">E911 service is legally required</strong> to be enabled for this plan. You cannot opt-out of 911 services on this tier.
                    </p>
                  </div>
                  <div className="bg-stone-50 border-2 border-stone-100 rounded-2xl p-6">
                    <p className="font-black text-stone-900 text-sm mb-2">
                      B. The &ldquo;Starter&rdquo; Plan (Free)
                    </p>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      This is a closed-loop, internal network. It only allows calls to other Ring Ring Club members. Because this plan does not connect to the public telephone network, it <strong className="text-stone-900">does not include and cannot reach 911 emergency services.</strong>
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 2 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 2</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">How E911 Works (Paid Plan Only)</h2>
                <p className="text-stone-700 text-base leading-relaxed">
                  When you dial 911 from a Ring Ring Club device on a paid plan, your call is routed over the internet to a specialized emergency call center. We use Enhanced 911 (E911) technology to send your phone number and your Registered Address to the local Public Safety Answering Point (PSAP) responsible for your area.
                </p>
              </section>

              <hr className="border-stone-100" />

              {/* Section 3 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 3</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">The &ldquo;Registered Address&rdquo; Requirement</h2>
                <p className="text-stone-600 text-base leading-relaxed mb-5">
                  Unlike traditional landlines, our hardware is portable and is not tied to a specific physical copper wire. Our system cannot automatically detect your physical location.
                </p>
                <div className="space-y-4">
                  {[
                    {
                      label: 'Mandatory Accuracy.',
                      body: 'You must provide the exact physical address where your hardware is located. Per the federal RAY BAUM\'S Act, this must include specific "dispatchable" details such as apartment, suite, or floor numbers to ensure responders can find you in a multi-unit building.',
                    },
                    {
                      label: 'Moving Hardware.',
                      body: 'If you move your Bridge or Standalone VoIP Phone to a new location (even temporarily), you must update your Registered Address in the Ring Ring Club Dashboard immediately.',
                    },
                    {
                      label: 'Activation Lag.',
                      body: 'It may take up to 48 hours for an address update to process through the national emergency routing database. During this window, 911 calls may be sent to your previous location.',
                    },
                  ].map((item) => (
                    <p key={item.label} className="text-stone-700 text-base leading-relaxed">
                      <strong className="text-stone-900">{item.label}</strong> {item.body}
                    </p>
                  ))}
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 4 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 4</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Critical Service Limitations</h2>
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-2">
                  <p className="font-black text-red-800 text-sm uppercase tracking-wide mb-4">
                    Your 911 service will NOT function if any of the following occur:
                  </p>
                  <div className="space-y-4">
                    {[
                      {
                        icon: '⚡',
                        label: 'Power Failure',
                        body: 'Your hardware and your internet router require electricity. 911 will not work during a power outage unless you provide a battery backup (UPS) for your equipment.',
                      },
                      {
                        icon: '🌐',
                        label: 'Internet Outage',
                        body: 'If your home internet service is down, congested, or disconnected, 911 calls will not connect.',
                      },
                      {
                        icon: '💳',
                        label: 'Account Suspension',
                        body: 'If your subscription is suspended (e.g., for non-payment), your 911 service will be deactivated.',
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-4">
                        <span className="text-xl flex-shrink-0">{item.icon}</span>
                        <div>
                          <p className="font-black text-red-900 text-sm">{item.label}</p>
                          <p className="text-red-700 text-sm leading-relaxed">{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 5 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 5</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Mandatory Warning Stickers</h2>
                <div className="flex items-start gap-5 bg-amber-50 border-2 border-amber-100 rounded-2xl p-6 mb-5">
                  <span className="text-4xl flex-shrink-0">🏷️</span>
                  <div>
                    <p className="text-stone-500 text-xs italic mb-1">[Photo: Red 911 sticker applied to a phone base]</p>
                  </div>
                </div>
                <p className="text-stone-700 text-base leading-relaxed">
                  Per FCC regulations, Ring Ring Club provides 911 Warning Stickers with all hardware orders. You are <strong className="text-stone-900">legally required</strong> to apply these stickers directly to your Ring Ring Club Bridge or Standalone VoIP Phone base. These stickers alert guests, babysitters, and children that the phone may not function like a traditional landline in an emergency and that they should use a secondary means of communication (like a mobile phone) if the power or internet is down.
                </p>
              </section>

              <hr className="border-stone-100" />

              {/* Section 6 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 6</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Limitation of Liability</h2>
                <p className="text-stone-700 text-base leading-relaxed mb-5">
                  By using the Service, you acknowledge these limitations and agree to release Ring Ring Club, its officers, and its employees from any and all claims, damages, or losses arising from the inability to reach emergency services through the Service.
                </p>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
                  <p className="text-stone-600 text-sm leading-relaxed font-semibold">
                    ⚠️ We strongly recommend that you always maintain an alternative means of reaching emergency services, such as a mobile phone.
                  </p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-600">
            <p>&copy; 2026 Ring Ring Club (CP Impact LLC). All rights reserved.</p>
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
