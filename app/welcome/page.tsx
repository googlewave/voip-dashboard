'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function WelcomeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('session_id');

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-4xl md:text-5xl font-black text-stone-900 mb-4">
          Welcome to Ring Ring!
        </h1>
        <p className="text-stone-600 text-xl mb-8 leading-relaxed">
          Your order is confirmed. We'll send you an email with setup instructions and tracking info.
        </p>
        <div className="bg-white rounded-3xl p-8 border-2 border-stone-100 mb-8">
          <h2 className="text-lg font-black text-stone-900 mb-4">What happens next?</h2>
          <div className="space-y-4 text-left text-sm text-stone-600">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#C4531A] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <div>
                <div className="font-bold text-stone-900">Check your email</div>
                <div>We've sent you a confirmation with your order details.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#C4531A] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <div>
                <div className="font-bold text-stone-900">We'll ship your hardware</div>
                <div>Your Ring Ring Bridge will arrive pre-configured and ready to plug in.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#C4531A] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <div>
                <div className="font-bold text-stone-900">Set up your circle</div>
                <div>Log in to your dashboard to add approved contacts and configure your phone.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#C4531A] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
              <div>
                <div className="font-bold text-stone-900">Let it ring!</div>
                <div>Plug in your phone and start making calls. That's it.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-4 bg-[#C4531A] text-white rounded-full font-bold hover:bg-[#a84313] transition"
          >
            Go to Dashboard →
          </button>
          <button
            onClick={() => router.push('/landing')}
            className="px-8 py-4 bg-white text-stone-700 border border-stone-200 rounded-full font-bold hover:bg-stone-50 transition"
          >
            Back to Home
          </button>
        </div>
        {sessionId && (
          <p className="mt-8 text-xs text-stone-400">
            Order ID: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-stone-500">Loading...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}
