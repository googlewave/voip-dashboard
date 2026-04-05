'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PrivacyPage() {
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
                Privacy Policy
              </h1>
              <p className="text-stone-400 text-sm">Last Updated: March 31, 2026</p>
            </div>

            <div className="space-y-12">

              {/* Section 1 — Privacy Manifesto (larger text per spec) */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 1</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-5">Our Privacy Manifesto</h2>
                <div className="space-y-5 text-stone-700 text-lg leading-relaxed">
                  <p>
                    At Ring Ring Club, we believe your home should be a sanctuary. Our services are operated by CP Impact LLC, a Pennsylvania limited liability company doing business as Ring Ring Club (&ldquo;Ring Ring Club,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
                  </p>
                  <p className="bg-amber-50 border-l-4 border-amber-400 pl-5 py-3 rounded-r-xl italic font-medium text-stone-800">
                    We built this Club because we wanted a way for our own children to connect without being tracked, profiled, or harvested for data. Our privacy policy is simple: <strong>We collect only what is necessary to make the phone ring.</strong>
                  </p>
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 2 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 2</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Information We Collect</h2>
                <p className="text-stone-600 text-base leading-relaxed mb-5">
                  When you join the Club or purchase hardware from our store, we collect the following information:
                </p>
                <div className="space-y-4">
                  {[
                    { label: 'Account Data', body: 'Name, billing address, service address (required for E911), and email address.' },
                    { label: 'The "Circle of Trust"', body: 'The names and phone numbers you manually enter into your Dashboard for your child\'s approved contact list.' },
                    { label: 'Browsing Data', body: 'When you visit our website, we automatically receive your computer\'s internet protocol (IP) address to provide us with information that helps us learn about your browser and operating system for site optimization.' },
                    { label: 'Email Marketing', body: 'With your express permission, we may send you emails about the Club, new hardware drops, and community updates.' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 bg-[#C4531A] rounded-full mt-2 flex-shrink-0" />
                      <p className="text-stone-700 text-base leading-relaxed">
                        <strong className="text-stone-900">{item.label}:</strong> {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 3 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 3</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-5">Consent and COPPA Compliance</h2>
                <div className="space-y-5">
                  <p className="text-stone-700 text-base leading-relaxed">
                    <strong className="text-stone-900">How do you get my consent?</strong> When you provide personal information to complete a transaction, verify your credit card (via Stripe), place an order, or arrange for a delivery, we imply that you consent to our collecting it and using it for that specific reason only.
                  </p>
                  <div className="bg-teal-50 border-2 border-teal-100 rounded-2xl p-6">
                    <p className="font-black text-stone-900 text-base mb-4">Children&apos;s Privacy (COPPA)</p>
                    <p className="text-stone-600 text-sm mb-4">
                      The Ring Ring Club is designed to be fully compliant with the Children&apos;s Online Privacy Protection Act (COPPA).
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: 'No Direct Collection', body: 'We do not knowingly collect personal information directly from children. Our hardware (the Bridge and handsets) is a "dumb" interface that does not prompt for data.' },
                        { label: 'Parental Control', body: 'Only a verified parent or guardian can create an account and manage the "Approved Contacts" list.' },
                        { label: 'No Monitoring', body: 'We do not record, monitor, or "listen in" on the content of voice conversations.' },
                        { label: 'Closed Loop', body: "Our network only allows calls from numbers you have explicitly approved, shielding your child's number from the public internet and automated crawlers." },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0" />
                          <p className="text-stone-600 text-sm leading-relaxed">
                            <strong className="text-stone-900">{item.label}:</strong> {item.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 4 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 4</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Data Storage and Infrastructure</h2>
                <p className="text-stone-600 text-base leading-relaxed mb-5">
                  Our member dashboard and store are hosted on Vercel, and our payment processing is handled by Stripe.
                </p>
                <div className="space-y-4">
                  {[
                    { label: 'A. Payments.', body: 'Your payment data is encrypted through the Payment Card Industry Data Security Standard (PCI-DSS). Your purchase transaction data is stored only as long as is necessary to complete your purchase transaction. Ring Ring Club does not store your credit card information on our own servers.' },
                    { label: 'B. Hosting.', body: 'Your account data is stored through secure databases managed by our hosting partners, protected by industry-standard firewalls and security protocols.' },
                  ].map((item) => (
                    <p key={item.label} className="text-stone-700 text-base leading-relaxed">
                      <strong className="text-stone-900">{item.label}</strong> {item.body}
                    </p>
                  ))}
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 5 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 5</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Third-Party Services</h2>
                <div className="space-y-4 text-stone-700 text-base leading-relaxed">
                  <p>
                    In general, the third-party providers used by us will only collect, use, and disclose your information to the extent necessary to allow them to perform the services they provide to us.
                  </p>
                  <p>
                    However, certain third-party service providers, such as payment gateways (Stripe) and telecommunications carriers (Twilio/Telnyx), have their own privacy policies. For these providers, we recommend that you read their privacy policies so you can understand the manner in which your personal information will be handled by these providers.
                  </p>
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 6 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 6</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Security</h2>
                <div className="space-y-4 text-stone-700 text-base leading-relaxed">
                  <p>
                    To protect your personal information, we take reasonable precautions and follow industry best practices to make sure it is not inappropriately lost, misused, accessed, disclosed, altered, or destroyed.
                  </p>
                  <p>
                    <strong className="text-stone-900">Encryption:</strong> All communication between your browser and our website is encrypted using secure socket layer technology (SSL). Voice signaling between your Ring Ring Club hardware and our network is similarly encrypted to prevent unauthorized interception.
                  </p>
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 7 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 7</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-5">Data Retention: We Don&apos;t Keep It Forever</h2>
                <blockquote className="border-l-4 border-amber-400 pl-5 py-2 mb-6 text-stone-700 italic text-lg font-medium">
                  &ldquo;We believe that data you don&apos;t have can&apos;t be stolen.&rdquo;
                </blockquote>
                <div className="space-y-4">
                  {[
                    { label: 'Call Metadata.', body: 'We retain logs of call times and durations for 90 days for billing and troubleshooting purposes. After 90 days, this data is anonymized.' },
                    { label: 'Account Termination.', body: 'If you cancel your membership, your personal data and your "Circle of Trust" are purged from our active systems within 30 days.' },
                  ].map((item) => (
                    <p key={item.label} className="text-stone-700 text-base leading-relaxed">
                      <strong className="text-stone-900">{item.label}</strong> {item.body}
                    </p>
                  ))}
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 8 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 8</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Your Rights and Contact Information</h2>
                <p className="text-stone-600 text-base leading-relaxed mb-5">
                  You have the right to access, correct, or delete the personal information we hold about you at any time. If you would like to exercise these rights, register a complaint, or simply want more information, please contact our Privacy Compliance Officer:
                </p>
                <address className="not-italic bg-stone-50 border border-stone-100 rounded-2xl p-6 text-stone-600 text-sm leading-relaxed space-y-1">
                  <p className="font-bold text-stone-900">Ring Ring Club (CP Impact LLC)</p>
                  <p>Attn: Privacy Officer</p>
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
