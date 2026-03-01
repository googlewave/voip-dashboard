'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GatePage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (password === process.env.NEXT_PUBLIC_SITE_PASSWORD) {
      localStorage.setItem('site_unlocked', 'true');
      router.push('/landing');
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-8">
      <div className="bg-stone-800 rounded-2xl p-10 w-full max-w-sm shadow-2xl border border-stone-700 text-center">
        <div className="text-5xl mb-4">🔔</div>
        <h1 className="text-2xl font-bold text-white mb-2">Ring Ring Club</h1>
        <p className="text-stone-400 text-sm mb-8">This site is private. Enter the password to continue.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 text-red-400 rounded-lg text-sm">
            Incorrect password. Try again.
          </div>
        )}

        <input
          type="password"
          className="w-full p-3 bg-stone-700 border border-stone-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4 placeholder-stone-500"
          placeholder="Enter password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button
          className="w-full py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
          onClick={handleSubmit}
          disabled={!password}
        >
          Enter Site
        </button>
      </div>
    </div>
  );
}
