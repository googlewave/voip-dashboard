'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Verify2FAPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setEmail(user.email ?? '');
      sendCode();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = async () => {
    setSending(true);
    setError('');
    const res = await fetch('/api/auth/send-otp', { method: 'POST' });
    setSending(false);
    if (res.ok) {
      setSent(true);
      setCountdown(60);
    } else {
      setError('Failed to send code. Try again.');
    }
  };

  const handleDigit = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== '')) void verify(next.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      void verify(text);
    }
  };

  const verify = async (code: string) => {
    setVerifying(true);
    setError('');
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: code }),
    });
    const data = await res.json();
    setVerifying(false);
    if (res.ok && data.verified) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) sessionStorage.setItem(`2fa_verified_${user.id}`, '1');
      router.push('/dashboard');
    } else {
      setError(data.error ?? 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 border-2 border-stone-100 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#C4531A]/10 flex items-center justify-center text-3xl mx-auto mb-4">
              🔐
            </div>
            <h1 className="text-2xl font-black text-stone-900 mb-2">Two-Factor Verification</h1>
            {sent && email ? (
              <p className="text-stone-500 text-sm">
                We sent a 6-digit code to <strong className="text-stone-700">{email}</strong>
              </p>
            ) : (
              <p className="text-stone-500 text-sm">Sending your verification code…</p>
            )}
          </div>

          {/* OTP Input */}
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={verifying}
                className="w-12 h-14 text-center text-2xl font-black border-2 border-stone-200 rounded-xl focus:border-[#C4531A] outline-none text-stone-900 transition disabled:opacity-50"
              />
            ))}
          </div>

          {verifying && (
            <p className="text-center text-sm text-stone-500 mb-4">Verifying…</p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-red-700 font-medium text-center">{error}</p>
            </div>
          )}

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-stone-400">
                Resend code in <span className="font-bold text-stone-600">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={sendCode}
                disabled={sending}
                className="text-sm font-bold text-[#C4531A] hover:underline disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
              className="text-sm text-stone-400 hover:text-stone-600 transition"
            >
              Sign out and try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
