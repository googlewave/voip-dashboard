'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const SITUATION_OPTIONS = [
  'I need a hand with my Setup',
  'My Bridge is acting up',
  'I found a weird phone at a yard sale',
  'Billing / Account Question',
  'Just saying Hello',
  'Something Else',
];

export default function ContactPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    situation: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter your name.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Please enter a valid email address.';
    if (!form.situation) e.situation = 'Please select a situation.';
    if (!form.message.trim()) e.message = 'Please tell us what\'s on your mind.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    // TODO: wire to API route / email service
    setSubmitted(true);
  };

  const field = (id: keyof typeof form, label: string, type: 'text' | 'email' = 'text') => (
    <div>
      <label htmlFor={id} className="block text-xs font-black text-stone-700 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={form[id]}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        className={`w-full px-4 py-3 rounded-xl border text-sm text-stone-800 bg-[#FAF7F2] placeholder-stone-300 outline-none transition focus:ring-2 focus:ring-[#C4531A]/30 ${errors[id] ? 'border-red-300' : 'border-stone-200 focus:border-[#C4531A]'}`}
        placeholder={type === 'email' ? 'you@example.com' : ''}
        autoComplete={type === 'email' ? 'email' : 'name'}
      />
      {errors[id] && <p className="mt-1 text-red-500 text-xs">{errors[id]}</p>}
    </div>
  );

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

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">

          {/* Hero */}
          <div className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Contact</span>
              <h1 className="text-5xl font-black text-stone-900 mt-3 mb-4 leading-tight tracking-tight">
                Dispatch from<br /> the Workshop
              </h1>
              <p className="text-stone-500 text-base leading-relaxed font-medium mb-1">
                Connecting from Berwyn, Pennsylvania.
              </p>
              <p className="text-stone-500 text-sm leading-relaxed mb-4">
                Between testing the mechanical bells on 1970s rotary phones and configuring the next batch of Ring Ring Bridges, things stay pretty busy (and loud) here in our Chester County workshop.
              </p>
              <p className="text-stone-500 text-sm leading-relaxed">
                We don&apos;t have a massive, overseas call center because we&apos;d rather keep our &ldquo;Make It Ring Ring&rdquo; plan under ten bucks. The most reliable way to catch us is through this digital portal. It goes straight to the workshop floor, where a real human — usually one of the founders — will read it and get back to you.
              </p>
            </div>

            {/* Workshop photo */}
            <div className="relative">
              <div className="w-full h-64 md:h-80 rounded-2xl bg-stone-200 overflow-hidden shadow-md relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-800/30 to-stone-800/50" />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '200px' }} />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white/60 text-xs italic">[Photo: Workshop bench — tools, coiled ash cord, stack of postcards]</p>
                </div>
              </div>
            </div>
          </div>

          {/* Command Center Form Card */}
          <div className="bg-white border border-stone-100 rounded-3xl shadow-md p-8 md:p-12 mb-10" style={{ position: 'relative', zIndex: 10 }}>
            {submitted ? (
              <div className="text-center py-8">
                <span className="text-5xl block mb-4">📬</span>
                <h2 className="text-2xl font-black text-stone-900 mb-2">Dispatch Received!</h2>
                <p className="text-stone-500 text-base max-w-sm mx-auto leading-relaxed">
                  A real human in Berwyn just got your message. We&apos;ll be in touch shortly.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', situation: '', message: '' }); }}
                  className="mt-6 text-[#C4531A] text-sm font-bold hover:underline"
                >
                  Send another →
                </button>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">The Form</span>
                  <h2 className="text-2xl font-black text-stone-900 mt-1">Send a Digital Dispatch</h2>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {field('name', 'Your Name')}
                    {field('email', 'Your Email', 'email')}
                  </div>

                  <div>
                    <label htmlFor="situation" className="block text-xs font-black text-stone-700 uppercase tracking-widest mb-1.5">
                      The Situation
                    </label>
                    <select
                      id="situation"
                      value={form.situation}
                      onChange={(e) => setForm({ ...form, situation: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border text-sm text-stone-800 bg-[#FAF7F2] outline-none transition cursor-pointer focus:ring-2 focus:ring-[#C4531A]/30 ${errors.situation ? 'border-red-300' : 'border-stone-200 focus:border-[#C4531A]'}`}
                    >
                      <option value="">Select a situation…</option>
                      {SITUATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.situation && <p className="mt-1 text-red-500 text-xs">{errors.situation}</p>}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-black text-stone-700 uppercase tracking-widest mb-1.5">
                      The Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us what&#39;s going on…"
                      className={`w-full px-4 py-3 rounded-xl border text-sm text-stone-800 bg-[#FAF7F2] placeholder-stone-300 resize-y outline-none transition focus:ring-2 focus:ring-[#C4531A]/30 ${errors.message ? 'border-red-300' : 'border-stone-200 focus:border-[#C4531A]'}`}
                    />
                    {errors.message && <p className="mt-1 text-red-500 text-xs">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#1a4a3a] hover:bg-[#143d30] text-white font-black text-sm rounded-full transition tracking-widest shadow-md"
                  >
                    SEND TO THE WORKSHOP
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Snail Mail Challenge */}
          <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-8 mb-8 relative overflow-hidden">
            {/* Polaroid-style corner accent */}
            <div className="absolute top-4 right-4 text-amber-200 text-4xl select-none">🐌</div>
            <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">The Analog Option</span>
            <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">The Snail Mail Challenge</h2>
            <p className="text-stone-600 text-base leading-relaxed mb-4">
              We still believe in the magic of a physical stamp and the weight of a real envelope. If you want to go full analog, send us a postcard or a letter.
            </p>
            <p className="text-stone-600 text-sm leading-relaxed mb-6">
              We pin every piece of mail we receive to our &ldquo;Club Wall of Fame.&rdquo; In return, we&apos;ll send you a pack of exclusive Ring Ring Club stickers and a note written on our vintage IBM Selectric typewriter (assuming we can still find fresh ribbons).
            </p>
            <address className="not-italic bg-white border border-amber-100 rounded-2xl p-5 text-stone-600 text-sm leading-loose inline-block shadow-sm">
              <p className="font-black text-stone-900 text-base">Ring Ring Club HQ</p>
              <p>142 Bodine Road</p>
              <p>Berwyn, PA 19312</p>
            </address>
          </div>

          {/* Are You a Neighbor? */}
          <div className="bg-white border border-stone-100 rounded-3xl p-8 shadow-sm">
            <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Local Folks</span>
            <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Are You a Neighbor?</h2>
            <p className="text-stone-600 text-base leading-relaxed mb-4">
              If you&apos;re local to the Main Line and want to drop off a vintage &ldquo;project phone&rdquo; for a check-up, or if you just want to see the Bridge in action, feel free to stop by.
            </p>
            <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5">
              <p className="text-xs font-black text-stone-500 uppercase tracking-widest mb-2">A Note from the Parents</p>
              <p className="text-stone-600 text-sm leading-relaxed">
                Since we are a working shop and not a retail storefront, please use the form above to &ldquo;ping&rdquo; us before you head over. We want to make sure the coffee is hot and someone is actually on-site to unlock the door for you.
              </p>
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
