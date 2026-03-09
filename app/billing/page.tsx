'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BillingContent() {
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    fetch('/api/user/plan')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setPlan(d.plan))
      .catch(err => {
        console.error('Plan fetch error:', err);
        setPlan('free');
      });
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const { url } = await res.json();
    router.push(url);
  }

  async function handleManage() {
    setLoading(true);
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const { url } = await res.json();
    router.push(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Billing</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            ← Back
          </button>
        </div>

        {/* Alerts */}
        {params.get('success') && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-xl shadow">
            🎉 Subscription activated! Welcome to Pro.
          </div>
        )}
        {params.get('canceled') && (
          <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-xl shadow">
            Checkout canceled. No charges were made.
          </div>
        )}

        {/* Plan Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Current Plan</p>
          <p className="text-2xl font-semibold mb-6">
            {plan === null ? 'Loading...' : plan === 'paid' ? '✅ Pro — $9.99/mo' : '🆓 Free'}
          </p>

          {plan === 'free' && (
            <div>
              <p className="text-gray-600 mb-4 text-sm">Upgrade to Pro to unlock calling to real phone numbers.</p>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Redirecting...' : 'Upgrade to Pro — $9.99/mo'}
              </button>
            </div>
          )}

          {plan === 'paid' && (
            <div>
              <p className="text-gray-600 mb-4 text-sm">Manage or cancel your subscription below.</p>
              <button
                onClick={handleManage}
                disabled={loading}
                className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
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
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 text-gray-500">Loading...</div>}>
      <BillingContent />
    </Suspense>
  );
}
