'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RefundsPage() {
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
            <div className="mb-12 pb-10 border-b border-stone-100">
              <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Legal</span>
              <h1 className="text-4xl md:text-5xl font-black text-stone-900 mt-3 mb-3 leading-tight">
                Refund &amp; Return Policy
              </h1>
              <p className="text-stone-400 text-sm">Last Updated: March 31, 2026</p>
            </div>

            {/* Guarantee */}
            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-8 mb-12">
              <h2 className="text-xl font-black text-stone-900 mb-4">Our &ldquo;Make It Ring&rdquo; Guarantee</h2>
              <p className="text-stone-600 text-base leading-relaxed mb-4">
                At Ring Ring Club, we want your home to be a sanctuary of conversation. Our services and products are provided by CP Impact LLC, a Pennsylvania limited liability company doing business as Ring Ring Club (&ldquo;Ring Ring Club,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
              </p>
              <p className="text-stone-600 text-base leading-relaxed">
                <strong className="text-stone-900">The Window:</strong> If you are not completely satisfied with your purchase, we are here to help. We offer a{' '}
                <strong className="text-stone-900">30-day Return Window</strong> from the date of delivery to ensure the Club is the right fit for your family.
              </p>
            </div>

            <div className="space-y-12">

              {/* Section 1 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 1</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-2">Hardware Returns</h2>
                <p className="text-stone-500 text-sm mb-6">
                  This policy applies to all hardware purchased through Ring Ring Club, including the Ring Ring Bridge, Analog Bundles, and Standalone VoIP Phones.
                </p>
                <div className="space-y-5">
                  <div>
                    <p className="text-stone-700 text-base leading-relaxed">
                      <strong className="text-stone-900">A. Return Window.</strong> You have 30 calendar days from the date of delivery to initiate a return.
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-700 text-base leading-relaxed">
                      <strong className="text-stone-900">B. Condition.</strong> To be eligible for a full refund, the hardware must be in the same functional condition that you received it. It must be returned in the original packaging with all included cables and power adapters.
                    </p>
                  </div>
                  <div className="bg-stone-50 border border-stone-100 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl flex-shrink-0">🚨</span>
                      <div>
                        <p className="font-black text-stone-900 text-sm mb-1">C. A Note on Stickers</p>
                        <p className="text-stone-600 text-sm leading-relaxed">
                          Because we require the application of 911 Warning Stickers for your safety, hardware returned with the 911 sticker applied is <strong>fully eligible for a refund</strong> and does not count as &ldquo;modified&rdquo; or &ldquo;damaged.&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-stone-900 font-bold text-sm mb-3">D. Non-Returnable Items</p>
                    <ul className="space-y-2">
                      {[
                        'Hardware that has been internally modified, "rooted," or opened.',
                        'Hardware damaged by power surges, water, or improper third-party installation.',
                        'Individual components from an Analog Bundle (the entire bundle must be returned together).',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3 text-stone-600 text-sm leading-relaxed">
                          <span className="w-1.5 h-1.5 bg-stone-400 rounded-full mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 2 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 2</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-2">Subscription Refunds</h2>
                <p className="text-stone-500 text-sm mb-6">
                  The &ldquo;Make It Ring Ring&rdquo; service ($8.95/mo) is a month-to-month subscription processed via Stripe.
                </p>
                <div className="space-y-5">
                  {[
                    {
                      label: 'A. Monthly Subscriptions.',
                      body: 'We do not offer pro-rated refunds for partial months of service. If you cancel, your service will remain active until the end of your current billing period.',
                    },
                    {
                      label: 'B. Annual Subscriptions.',
                      body: 'If you purchased an annual plan, you may request a full refund within the first 30 days of the subscription. After 30 days, annual plans are non-refundable.',
                    },
                    {
                      label: 'C. The Starter Plan.',
                      body: 'Our Free Starter Plan has no monthly cost and, therefore, no refund eligibility.',
                    },
                    {
                      label: 'D. Activation Fees.',
                      body: 'Any one-time activation or "Club Entry" fees are non-refundable once the hardware has been configured and shipped to your address.',
                    },
                  ].map((item) => (
                    <p key={item.label} className="text-stone-700 text-base leading-relaxed">
                      <strong className="text-stone-900">{item.label}</strong> {item.body}
                    </p>
                  ))}
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 3 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 3</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-6">Shipping Costs</h2>
                <div className="space-y-5">
                  {[
                    {
                      label: 'A. Original Shipping.',
                      body: 'Shipping costs paid at the time of purchase are non-refundable.',
                    },
                    {
                      label: 'B. Return Shipping.',
                      body: 'You are responsible for the cost of shipping the hardware back to our facility. We recommend using a trackable service (USPS Ground Advantage or UPS), as we cannot issue a refund for items lost in transit.',
                    },
                    {
                      label: 'C. Defective Items (DOA).',
                      body: 'If your hardware is defective upon arrival, Ring Ring Club will provide a pre-paid return label and ship a replacement unit at no cost to you.',
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
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-6">The Refund Process</h2>
                <div className="space-y-4">
                  {[
                    {
                      step: '01',
                      label: 'Initiate',
                      body: 'Email support@ringringphone.com with your Order Number and the reason for your return.',
                    },
                    {
                      step: '02',
                      label: 'Approval',
                      body: 'Once authorized, we will provide you with the return shipping address for our Berwyn, PA facility.',
                    },
                    {
                      step: '03',
                      label: 'Inspection',
                      body: 'Upon receipt, we will inspect the item and notify you of the status of your refund.',
                    },
                    {
                      step: '04',
                      label: 'Credit',
                      body: 'Approved refunds are credited back to your original method of payment via Stripe. Please allow 5–10 business days for the credit to appear on your statement.',
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-5 items-start">
                      <div className="w-10 h-10 rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-amber-600">{item.step}</span>
                      </div>
                      <div className="pt-2">
                        <p className="text-stone-700 text-base leading-relaxed">
                          <strong className="text-stone-900">{item.label}:</strong> {item.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 5 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 5</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Exchanges (Vintage &amp; Modern Classics)</h2>
                <p className="text-stone-700 text-base leading-relaxed">
                  Because many of our handsets are &ldquo;Modern Classics&rdquo; or curated thrifted treasures, each is unique. If your specific handset has a mechanical issue, we will attempt to exchange it for a similar model of equal value. If a similar model is not available, we will issue a full refund for the handset portion of your order.
                </p>
              </section>

              <hr className="border-stone-100" />

              {/* Section 6 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 6</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Damaged Items</h2>
                <p className="text-stone-700 text-base leading-relaxed">
                  If your package arrives visibly damaged, please take a photo of the box and the hardware and contact us at{' '}
                  <a href="mailto:support@ringringphone.com" className="text-[#C4531A] hover:underline">support@ringringphone.com</a>{' '}
                  within <strong className="text-stone-900">48 hours of delivery</strong> so we can file a claim with the carrier.
                </p>
              </section>

              <hr className="border-stone-100" />

              {/* Section 7 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 7</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Contact Us</h2>
                <p className="text-stone-600 text-base leading-relaxed mb-5">
                  If you have any questions on how to return your item to us, contact the parents at:
                </p>
                <address className="not-italic bg-stone-50 border border-stone-100 rounded-2xl p-6 text-stone-600 text-sm leading-relaxed space-y-1">
                  <p className="font-bold text-stone-900">Ring Ring Club (CP Impact LLC)</p>
                  <p>Attn: Returns Department</p>
                  <p>Berwyn, PA 19312</p>
                  <p>
                    <a href="mailto:support@ringringphone.com" className="text-[#C4531A] hover:underline">support@ringringphone.com</a>
                  </p>
                </address>
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
