'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ✅ Add your admin emails here
const ADMIN_EMAILS = ['you@yourdomain.com'];

type Step = 'credentials' | 'otp';
type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const redirectAfterAuth = (userEmail: string) => {
    if (ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // ── Sign Up ──────────────────────────────────────────────
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Check your email to confirm your account, then sign in.');
        setMode('signin');
      }
      setLoading(false);
      return;
    }

    // ── Sign In: Step 1 — validate password ──────────────────
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    // Sign out immediately — OTP becomes the real session gate
    await supabase.auth.signOut();

    // ── Step 2 — send email OTP ──────────────────────────────
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      setError('Could not send verification code. Please try again.');
      setLoading(false);
      return;
    }

    setStep('otp');
    setLoading(false);
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp.replace(/\s/g, ''),
      type: 'email',
    });

    if (error || !data.user) {
      setError('Invalid or expired code. Please try again.');
      setLoading(false);
      return;
    }

    redirectAfterAuth(data.user.email ?? '');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">

      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <button
          onClick={() => router.push('/landing')}
          className="text-xl font-extrabold text-stone-800 tracking-tight hover:text-orange-500 transition"
        >
          🔔 Ring Ring Club
        </button>
        <button
          onClick={() => router.push('/landing')}
          className="text-sm text-stone-400 hover:text-stone-700 transition"
        >
          ← Back to home
        </button>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {step === 'credentials' ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-orange-200">
                  🔔
                </div>
                <h1 className="text-3xl font-extrabold text-stone-800 mb-1">
                  {mode === 'signin' ? 'Welcome back' : 'Join the club'}
                </h1>
                <p className="text-stone-400 text-sm">
                  {mode === 'signin'
                    ? 'Sign in to your Ring Ring Club account'
                    : 'Create your account in seconds'}
                </p>
              </div>

              {/* Tab Toggle */}
              <div className="flex bg-orange-100 rounded-xl p-1 mb-6 border border-orange-200">
                <button
                  onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                    mode === 'signin'
                      ? 'bg-white text-orange-500 shadow-sm'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                    mode === 'signup'
                      ? 'bg-white text-orange-500 shadow-sm'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Form */}
              <div className="bg-white rounded-2xl border border-orange-100 shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-stone-600 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-600 mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Choose a strong password' : '••••••••'}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition text-sm"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                      <span className="mt-0.5">❌</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                      <span className="mt-0.5">✅</span>
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold rounded-xl transition shadow-md text-sm"
                  >
                    {loading
                      ? mode === 'signin' ? 'Sending code...' : 'Creating account...'
                      : mode === 'signin' ? 'Continue →' : 'Create Account 🔔'}
                  </button>
                </form>
              </div>

              <p className="text-center text-xs text-stone-400 mt-6">
                By signing in, you agree to our{' '}
                <button className="underline hover:text-stone-600 transition">Terms</button> and{' '}
                <button className="underline hover:text-stone-600 transition">Privacy Policy</button>
              </p>
            </>
          ) : (
            <>
              {/* OTP Step */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-orange-200">
                  📧
                </div>
                <h1 className="text-3xl font-extrabold text-stone-800 mb-1">Check your email</h1>
                <p className="text-stone-400 text-sm max-w-xs mx-auto">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-stone-600">{email}</span>
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-orange-100 shadow-lg p-8">
                <form onSubmit={handleOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-stone-600 mb-1.5">
                      Verification code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={7}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      className="w-full px-4 py-4 rounded-xl border border-stone-200 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition text-2xl font-mono tracking-[0.5em] text-center"
                      autoFocus
                    />
                    <p className="text-xs text-stone-400 mt-2 text-center">
                      Code expires in 10 minutes
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                      <span className="mt-0.5">❌</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.replace(/\s/g, '').length < 6}
                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold rounded-xl transition shadow-md text-sm"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In →'}
                  </button>

                  {/* Resend */}
                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setError('');
                        await supabase.auth.signInWithOtp({
                          email,
                          options: { shouldCreateUser: false },
                        });
                        setSuccess('New code sent!');
                        setTimeout(() => setSuccess(''), 3000);
                      }}
                      className="text-sm text-orange-500 hover:text-orange-600 font-semibold transition"
                    >
                      Resend code
                    </button>
                    {success && (
                      <p className="text-xs text-green-600 font-medium">{success}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setStep('credentials'); setOtp(''); setError(''); }}
                    className="w-full py-2.5 text-stone-400 hover:text-stone-600 text-sm transition font-medium"
                  >
                    ← Use a different account
                  </button>
                </form>
              </div>

              <p className="text-center text-xs text-stone-400 mt-6">
                Didn't get it? Check your spam folder
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
