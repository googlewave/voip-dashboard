'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PortalSelectPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setEmail(session.user.email || '');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-stone-900 mb-2">Choose Your Portal</h1>
          <p className="text-stone-500">Logged in as: {email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* User Dashboard */}
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-white rounded-3xl p-8 border-2 border-stone-100 hover:border-[#C4531A] hover:shadow-xl transition text-left group"
          >
            <div className="text-5xl mb-4">👤</div>
            <h2 className="text-2xl font-black text-stone-900 mb-2 group-hover:text-[#C4531A] transition">
              User Dashboard
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-4">
              Manage your devices, contacts, and subscription as a regular Ring Ring customer.
            </p>
            <ul className="space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                Device management
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                Contact whitelist
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                Quick dial shortcuts
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                Quiet hours & usage caps
              </li>
            </ul>
          </button>

          {/* Admin Portal */}
          <button
            onClick={() => router.push('/admin')}
            className="bg-gradient-to-br from-[#C4531A] to-[#a84313] rounded-3xl p-8 border-2 border-[#C4531A] hover:shadow-2xl transition text-left group"
          >
            <div className="text-5xl mb-4">⚡</div>
            <h2 className="text-2xl font-black text-white mb-2">
              Admin Portal
            </h2>
            <p className="text-orange-100 text-sm leading-relaxed mb-4">
              Full system access with user management, manual billing, provisioning, and analytics.
            </p>
            <ul className="space-y-2 text-sm text-orange-50">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">✓</span>
                All user features
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">✓</span>
                Manage all users & devices
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">✓</span>
                Manual billing controls
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">✓</span>
                System analytics & health
              </li>
            </ul>
          </button>

        </div>

        <div className="text-center mt-8">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/landing');
            }}
            className="text-sm text-stone-500 hover:text-stone-800 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
