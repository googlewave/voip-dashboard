'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ANNUAL_MONTHLY_EQUIVALENT, ANNUAL_PLAN_PRICE, MONTHLY_PLAN_PRICE } from '@/lib/pricing';

type Plan = 'free' | 'monthly' | 'annual';

function BillingContent() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    fetch('/api/user/plan')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setPlan((d.plan || 'free') as Plan))
      .catch((err) => {
        console.error('Plan fetch error:', err);
        setPlan('free');
      });
  }, []);

  async function handleUpgrade(selected: 'monthly' | 'annual') {
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selected }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      router.push(url);
    } catch (err) {
      console.error('Upgrade error:', err);
      setLoading(false);
    }
  }

  async function handleManage() {
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      router.push(url);
    } catch (err) {
      console.error('Manage error:', err);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-stone-900">Billing</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-white text-stone-700 rounded-lg hover:bg-stone-50 transition font-medium border border-stone-200"
          >
            ← Back
          </button>
        </div>

        {/* Alerts */}
        {params.get('success') && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-xl shadow">
            Subscription activated successfully.
          </div>
        )}
        {params.get('canceled') && (
          <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-xl shadow">
            Checkout canceled. No charges were made.
          </div>
        )}

        {/* Plan Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-stone-100">
          <p className="text-sm text-stone-500 mb-1">Current Plan</p>
          <p className="text-2xl font-semibold mb-6 text-stone-900">
            {plan === null
              ? 'Loading...'
              : plan === 'annual'
              ? `Annual — $${ANNUAL_PLAN_PRICE.toFixed(2)}/yr`
              : plan === 'monthly'
              ? `Monthly — $${MONTHLY_PLAN_PRICE.toFixed(2)}/mo`
              : 'Free'}
          </p>

          {plan === 'free' && (
            <div className="space-y-5">
              <p className="text-stone-600 text-sm">
                Upgrade to unlock calling to real phone numbers.
              </p>
              <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200">
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${selectedPlan === 'monthly' ? 'bg-white text-[#C4531A] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedPlan('annual')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${selectedPlan === 'annual' ? 'bg-white text-[#C4531A] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Annual
                </button>
              </div>
              <div className="rounded-2xl border-2 border-stone-200 p-5 bg-stone-50">
                <p className="text-sm font-bold text-stone-900 mb-1">{selectedPlan === 'annual' ? 'Annual Plan' : 'Monthly Plan'}</p>
                <p className="text-3xl font-black text-stone-900 mb-1">
                  {selectedPlan === 'annual' ? `$${ANNUAL_PLAN_PRICE.toFixed(2)}/yr` : `$${MONTHLY_PLAN_PRICE.toFixed(2)}/mo`}
                </p>
                <p className="text-sm text-stone-500">
                  {selectedPlan === 'annual'
                    ? `About $${ANNUAL_MONTHLY_EQUIVALENT.toFixed(2)}/month, billed yearly.`
                    : 'Billed monthly. Cancel anytime.'}
                </p>
              </div>
              <button
                onClick={() => handleUpgrade(selectedPlan)}
                disabled={loading}
                className="px-6 py-3 bg-[#C4531A] text-white font-medium rounded-xl hover:bg-[#a84313] transition disabled:opacity-50"
              >
                {loading ? 'Redirecting...' : `Start ${selectedPlan === 'annual' ? 'Annual' : 'Monthly'} Plan`}
              </button>
            </div>
          )}

          {(plan === 'monthly' || plan === 'annual') && (
            <div>
              <p className="text-stone-600 mb-4 text-sm">
                Manage or cancel your subscription below.
              </p>
              <button
                onClick={handleManage}
                disabled={loading}
                className="px-6 py-3 bg-stone-800 text-white font-medium rounded-xl hover:bg-stone-900 transition disabled:opacity-50"
              >
                {loading ? 'Redirecting...' : 'Manage Subscription'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] p-8 text-stone-500">
          Loading...
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
