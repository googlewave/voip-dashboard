'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function TermsPage() {
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
                Terms of Service
              </h1>
              <p className="text-stone-400 text-sm">Last Updated: March 31, 2026</p>
            </div>

            {/* Overview */}
            <div className="mb-12">
              <h2 className="text-xl font-black text-stone-900 mb-4">Overview</h2>
              <div className="space-y-4 text-stone-600 text-base leading-relaxed">
                <p>
                  This website and the services offered herein are operated by CP Impact LLC, a Pennsylvania limited liability company doing business as Ring Ring Club (&ldquo;Ring Ring Club,&rdquo; &ldquo;the Club,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). Throughout the site, the terms &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; refer to Ring Ring Club. We offer this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
                </p>
                <p>
                  By visiting our site and/or purchasing something from us, you engage in our &ldquo;Service&rdquo; and agree to be bound by the following terms and conditions (&ldquo;Terms of Service&rdquo;, &ldquo;Terms&rdquo;), including those additional terms and conditions and policies referenced herein and/or available by hyperlink.
                </p>
                <p>
                  Please read these Terms of Service carefully before accessing or using our website. By accessing or using any part of the site, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services.
                </p>
              </div>
            </div>

            <div className="space-y-12">

              {/* Section 1 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 1</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Eligibility and Parental Consent</h2>
                <div className="space-y-4 text-stone-700 text-base leading-relaxed">
                  <p>
                    The Ring Ring Club is a service designed for family communication. By agreeing to these Terms of Service, you represent that you are at least 18 years of age (the age of majority in the Commonwealth of Pennsylvania).
                  </p>
                  <p>
                    As the Service is intended for use by minors, you, as the parent or legal guardian, provide express consent for the minors under your supervision to use the hardware and software associated with the Club. You acknowledge that you are solely responsible for managing the &ldquo;Circle of Trust&rdquo; (Approved Contacts) and for monitoring your child&apos;s use of the Service.
                  </p>
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 2 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 2</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Hardware and Equipment</h2>
                <p className="text-stone-600 text-base leading-relaxed mb-5">
                  We offer three primary hardware configurations (collectively, the &ldquo;Hardware&rdquo;):
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    { name: 'The Ring Ring Bridge', desc: 'A Voice-over-IP (VoIP) adapter designed to connect third-party analog telephones to our network.' },
                    { name: 'The Analog Bundle', desc: 'A package consisting of a Ring Ring Bridge and a curated analog handset.' },
                    { name: 'Standalone VoIP Phones', desc: 'Native IP-based telephones that connect directly to a router.' },
                  ].map((item) => (
                    <li key={item.name} className="flex items-start gap-3 text-stone-600 text-sm leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-[#C4531A] rounded-full mt-2 flex-shrink-0" />
                      <span><strong className="text-stone-900">{item.name}:</strong> {item.desc}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-4">
                  {[
                    { label: 'A. Ownership and Title.', body: 'Title to Hardware passes to you upon our delivery to the carrier (USPS/UPS).' },
                    { label: 'B. Installation.', body: 'You are responsible for providing a compatible high-speed internet connection and a functional router. We are not responsible for the performance or electrical safety of third-party analog phones provided by the user ("Bring Your Own Phone").' },
                    { label: 'C. Limited Warranty.', body: 'Hardware sold directly by us is warranted against manufacturing defects for a period of one (1) year from the date of delivery. This warranty does not cover damage caused by misuse, power surges, or unauthorized modifications.' },
                  ].map((item) => (
                    <p key={item.label} className="text-stone-700 text-base leading-relaxed">
                      <strong className="text-stone-900">{item.label}</strong> {item.body}
                    </p>
                  ))}
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 3 — E911 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 3</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Emergency Services (E911) Disclosure</h2>
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🚨</span>
                    <div>
                      <p className="font-black text-red-800 text-sm uppercase tracking-wide mb-2">Please Read This Section Carefully</p>
                      <p className="text-red-700 text-sm leading-relaxed">
                        It contains critical information regarding emergency calling.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-stone-600 text-base leading-relaxed mb-5">
                  By using our VoIP-based Service, you acknowledge and understand that 911 emergency dialing operates differently than traditional landline services.
                </p>
                <div className="space-y-4">
                  <p className="text-stone-700 text-base leading-relaxed">
                    <strong className="text-stone-900">A. Registered Address.</strong> Per FCC regulations (including RAY BAUM&apos;S Act), 911 calls are routed based on the physical address you provide during registration (&ldquo;Registered Address&rdquo;). This must be a &ldquo;dispatchable location&rdquo; including specific apartment or suite numbers.
                  </p>
                  <p className="text-stone-700 text-base leading-relaxed">
                    <strong className="text-stone-900">B. Moving Hardware.</strong> If you move your Bridge or VoIP Phone to a new location, you must update your Registered Address in the Ring Ring Club Dashboard immediately. Address updates may take up to 48 hours to process.
                  </p>
                  <div>
                    <p className="text-stone-900 font-bold text-sm mb-3">C. Service Limitations. 911 service will NOT function if:</p>
                    <ul className="space-y-2">
                      {[
                        'Your home loses electrical power (unless you provide a battery backup/UPS).',
                        'Your internet service is disconnected or experiencing an outage.',
                        'Your account is suspended for non-payment.',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3 text-stone-600 text-sm leading-relaxed">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-stone-700 text-base leading-relaxed">
                    <strong className="text-stone-900">D. Limitation of Liability.</strong> You agree to release Ring Ring Club, its officers, and its employees from any and all claims, damages, or losses arising from the inability to reach emergency services through the Service.
                  </p>
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 4 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 4</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-5">Subscriptions, Billing, and Payments</h2>
                <div className="space-y-4">
                  {[
                    { label: 'A. Stripe Processing.', body: 'We use Stripe as our third-party payment processor. By subscribing to the "Make It Ring Ring" plan or purchasing hardware, you agree to Stripe\'s Terms of Service and authorize us to charge your provided payment method.' },
                    { label: 'B. Recurring Billing.', body: 'Subscriptions are billed in advance on a recurring monthly or annual basis.' },
                    { label: 'C. Taxes.', body: 'We collect applicable Pennsylvania Sales and Use Tax on all hardware and taxable services. You are responsible for all applicable taxes and telecommunications surcharges based on your billing address.' },
                    { label: 'D. Cancellation.', body: 'You may cancel your subscription at any time via your Member Dashboard. Cancellations are effective at the end of the current billing cycle; we do not offer pro-rated refunds for partial months.' },
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
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">The &ldquo;Circle of Trust&rdquo; and Acceptable Use</h2>
                <p className="text-stone-600 text-base leading-relaxed mb-4">
                  Our Service is a &ldquo;Closed Loop&rdquo; system. You agree that:
                </p>
                <ul className="space-y-3">
                  {[
                    'You will only add contacts to the "Approved Contacts" list whom you trust to communicate with your child.',
                    'You will not use the Service for any unlawful purpose, including harassment, robocalling, or telemarketing.',
                    'You will not attempt to reverse-engineer, decompile, or modify the firmware of the Ring Ring Club Bridge or VoIP hardware.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-stone-600 text-sm leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-[#C4531A] rounded-full mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <hr className="border-stone-100" />

              {/* Section 6 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 6</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Intellectual Property</h2>
                <p className="text-stone-700 text-base leading-relaxed">
                  All content included in the Service, such as text, graphics, logos, images, and software, is the property of Ring Ring Club or its content suppliers and is protected by United States and international copyright laws. The &ldquo;Ring Ring Club&rdquo; name, brand marks, and logo are trademarks of Ring Ring Club.
                </p>
              </section>

              <hr className="border-stone-100" />

              {/* Section 7 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 7</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Disclaimer of Warranties; Limitation of Liability</h2>
                <div className="space-y-4 text-stone-700 text-base leading-relaxed">
                  <p>
                    We do not guarantee, represent or warrant that your use of our service will be uninterrupted, timely, secure or error-free. The service and all products and services delivered to you through the service are (except as expressly stated by us) provided &lsquo;as is&rsquo; and &lsquo;as available&rsquo; for your use.
                  </p>
                  <p>
                    In no case shall Ring Ring Club, our directors, officers, employees, affiliates, agents, or contractors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, including, without limitation lost profits, lost revenue, lost savings, loss of data, or any similar damages, whether based in contract, tort (including negligence), strict liability or otherwise, arising from your use of the service. In jurisdictions where the exclusion or the limitation of liability for consequential or incidental damages is not allowed, our liability shall be limited to the maximum extent permitted by law.
                  </p>
                </div>
              </section>

              <hr className="border-stone-100" />

              {/* Section 8 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 8</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Indemnification</h2>
                <p className="text-stone-700 text-base leading-relaxed">
                  You agree to indemnify, defend and hold harmless Ring Ring Club and our parent, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, and employees, harmless from any claim or demand, including reasonable attorneys&apos; fees, made by any third-party due to or arising out of your breach of these Terms of Service or your violation of any law or the rights of a third-party.
                </p>
              </section>

              <hr className="border-stone-100" />

              {/* Section 9 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 9</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Governing Law</h2>
                <p className="text-stone-700 text-base leading-relaxed">
                  These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms shall be brought exclusively in the federal or state courts located in Chester County, Pennsylvania.
                </p>
              </section>

              <hr className="border-stone-100" />

              {/* Section 10 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 10</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Changes to Terms of Service</h2>
                <p className="text-stone-700 text-base leading-relaxed">
                  You can review the most current version of the Terms of Service at any time at this page. We reserve the right to update, change or replace any part of these Terms of Service by posting updates and changes to our website. It is your responsibility to check our website periodically for changes. Your continued use of or access to our website or the Service following the posting of any changes constitutes acceptance of those changes.
                </p>
              </section>

              <hr className="border-stone-100" />

              {/* Section 11 */}
              <section>
                <span className="text-[#C4531A] text-xs font-black uppercase tracking-widest">Section 11</span>
                <h2 className="text-2xl font-black text-stone-900 mt-1 mb-4">Contact Information</h2>
                <p className="text-stone-600 text-base leading-relaxed mb-5">
                  Questions about the Terms of Service should be sent to us at:
                </p>
                <address className="not-italic bg-stone-50 border border-stone-100 rounded-2xl p-6 text-stone-600 text-sm leading-relaxed space-y-1">
                  <p className="font-bold text-stone-900">Ring Ring Club (CP Impact LLC)</p>
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
