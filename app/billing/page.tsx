'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BillingPage() {
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
      setPlan('free'); // fallback
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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Billing</h1>

      {params.get('success') && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
          🎉 Subscription activated! Welcome to Pro.
        </div>
      )}
      {params.get('canceled') && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
          Checkout canceled. No charges were made.
        </div>
      )}

      <div className="border rounded-xl p-6 mt-4">
        <p className="text-sm text-gray-500 mb-1">Current Plan</p>
        <p className="text-2xl font-semibold capitalize mb-4">
          {plan === null ? 'Loading...' : plan === 'paid' ? '✅ Pro — $9.99/mo' : '🆓 Free'}
        </p>

        {plan === 'free' && (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Upgrade to Pro — $9.99/mo'}
          </button>
        )}

        {plan === 'paid' && (
          <button
            onClick={handleManage}
            disabled={loading}
            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Manage Subscription'}
          </button>
        )}
      </div>
    </div>
  );
}
