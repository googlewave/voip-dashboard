'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type HardwareOption = 'adapter' | 'kit' | null;
type PlanOption = 'free' | 'monthly' | 'annual' | null;
type DeliveryOption = 'pickup' | 'shipping' | null;

export default function BuyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [hardware, setHardware] = useState<HardwareOption>(null);
  const [plan, setPlan] = useState<PlanOption>(null);
  const [delivery, setDelivery] = useState<DeliveryOption>(null);
  const [loading, setLoading] = useState(false);

  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
  });
  const [e911Address, setE911Address] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
  });
  const [useShippingForE911, setUseShippingForE911] = useState(true);

  const canProceed = () => {
    if (step === 1) return hardware !== null;
    if (step === 2) return plan !== null;
    if (step === 3) return delivery !== null;
    if (step === 4) {
      if (!email || !name) return false;
      if (plan !== 'free' && !areaCode) return false;
      if (delivery === 'shipping' && (!shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip)) return false;
      if (plan !== 'free' && !useShippingForE911 && (!e911Address.line1 || !e911Address.city || !e911Address.state || !e911Address.zip)) return false;
      return true;
    }
    return false;
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/buy/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hardware,
          plan,
          delivery,
          email,
          password,
          name,
          areaCode: plan !== 'free' ? areaCode : null,
          shippingAddress: delivery === 'shipping' ? shippingAddress : null,
          e911Address: plan !== 'free' ? (useShippingForE911 ? shippingAddress : e911Address) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
        setLoading(false);
      }
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  const hardwarePrice = hardware === 'adapter' ? 39 : hardware === 'kit' ? 69 : 0;
  const planPrice = plan === 'monthly' ? 8.95 : plan === 'annual' ? 85.80 : 0;
  const total = hardwarePrice + (plan === 'free' ? 0 : planPrice);

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <button
            onClick={() => router.push('/landing')}
            className="text-stone-500 hover:text-stone-800 text-sm mb-4 inline-block"
          >
            ← Back to home
          </button>
          <h1 className="text-4xl font-black text-stone-900 mb-2">Join Ring Ring</h1>
          <p className="text-stone-500">Get your home phone set up in 4 simple steps.</p>
        </div>

        {/* Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${step >= s ? 'bg-[#C4531A] text-white' : 'bg-stone-200 text-stone-400'}`}>
                  {s}
                </div>
                {s < 4 && <div className={`w-16 h-1 mx-2 transition ${step > s ? 'bg-[#C4531A]' : 'bg-stone-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between max-w-2xl mx-auto mt-3 text-xs text-stone-500 font-medium">
            <span>Hardware</span>
            <span>Plan</span>
            <span>Delivery</span>
            <span>Checkout</span>
          </div>
        </div>

        {/* Step 1 — Hardware */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-10 border-2 border-stone-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-stone-900 mb-2">Choose your hardware</h2>
            <p className="text-stone-500 text-sm mb-8">Pick the Ring Ring Bridge adapter, or get a starter kit with a phone included.</p>
            <div className="space-y-4">
              <button
                onClick={() => setHardware('adapter')}
                className={`w-full p-6 rounded-2xl border-2 text-left transition ${hardware === 'adapter' ? 'border-[#C4531A] bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black text-stone-900 mb-1">Ring Ring Bridge (Adapter Only)</div>
                    <div className="text-sm text-stone-500">Bring your own phone. The adapter arrives pre-configured.</div>
                  </div>
                  <div className="text-2xl font-black text-stone-900">$39</div>
                </div>
              </button>
              <button
                onClick={() => setHardware('kit')}
                className={`w-full p-6 rounded-2xl border-2 text-left transition ${hardware === 'kit' ? 'border-[#C4531A] bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black text-stone-900 mb-1">Starter Kit (Adapter + Phone)</div>
                    <div className="text-sm text-stone-500">Curated phone + adapter. Ready to ring out of the box.</div>
                  </div>
                  <div className="text-2xl font-black text-stone-900">$69</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Plan */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-10 border-2 border-stone-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-stone-900 mb-2">Choose your plan</h2>
            <p className="text-stone-500 text-sm mb-8">Calling another Ring Ring family is always free. Upgrade for full access.</p>
            <div className="space-y-4">
              <button
                onClick={() => setPlan('free')}
                className={`w-full p-6 rounded-2xl border-2 text-left transition ${plan === 'free' ? 'border-[#C4531A] bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-black text-stone-900">Starter Plan</div>
                  <div className="text-2xl font-black text-stone-900">Free</div>
                </div>
                <div className="text-sm text-stone-500 space-y-1">
                  <div>✓ Unlimited Ring Ring → Ring Ring calls</div>
                  <div>✓ Up to 5 approved contacts</div>
                  <div>✓ Online/offline toggle</div>
                </div>
              </button>
              <button
                onClick={() => setPlan('monthly')}
                className={`w-full p-6 rounded-2xl border-2 text-left transition ${plan === 'monthly' ? 'border-[#C4531A] bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-black text-stone-900">Make It Ring Ring (Monthly)</div>
                  <div className="text-2xl font-black text-stone-900">$8.95<span className="text-sm text-stone-400">/mo</span></div>
                </div>
                <div className="text-sm text-stone-500 space-y-1">
                  <div>✓ Everything in Starter</div>
                  <div>✓ Unlimited calls to any US number</div>
                  <div>✓ Quiet Hours, Kill Switch, Usage Caps</div>
                  <div>✓ Real E911 with verified address</div>
                </div>
              </button>
              <button
                onClick={() => setPlan('annual')}
                className={`w-full p-6 rounded-2xl border-2 text-left transition ${plan === 'annual' ? 'border-[#C4531A] bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-black text-stone-900">Make It Ring Ring (Annual)</div>
                    <div className="text-xs text-[#C4531A] font-bold">Save 20%</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-stone-900">$85.80<span className="text-sm text-stone-400">/yr</span></div>
                    <div className="text-xs text-stone-400">~$7.16/mo</div>
                  </div>
                </div>
                <div className="text-sm text-stone-500 space-y-1">
                  <div>✓ Everything in Monthly</div>
                  <div>✓ Save $21/year</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Delivery */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-10 border-2 border-stone-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-stone-900 mb-2">How should we get this to you?</h2>
            <p className="text-stone-500 text-sm mb-8">Choose pickup if you're local to the Philadelphia area.</p>
            <div className="space-y-4">
              <button
                onClick={() => setDelivery('pickup')}
                className={`w-full p-6 rounded-2xl border-2 text-left transition ${delivery === 'pickup' ? 'border-[#C4531A] bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}
              >
                <div className="font-black text-stone-900 mb-1">Local Pickup (Free)</div>
                <div className="text-sm text-stone-500">We'll coordinate a pickup time in the Philadelphia area.</div>
              </button>
              <button
                onClick={() => setDelivery('shipping')}
                className={`w-full p-6 rounded-2xl border-2 text-left transition ${delivery === 'shipping' ? 'border-[#C4531A] bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}
              >
                <div className="font-black text-stone-900 mb-1">Shipping</div>
                <div className="text-sm text-stone-500">We'll ship your hardware. Shipping cost calculated at checkout.</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Checkout */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-10 border-2 border-stone-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-stone-900 mb-2">Complete your order</h2>
            <p className="text-stone-500 text-sm mb-8">Create your account and finalize payment.</p>
            
            <div className="space-y-6">
              {/* Account */}
              <div>
                <label className="block text-sm font-bold text-stone-900 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                  placeholder="Create a password"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                  placeholder="Your name"
                />
              </div>

              {/* Area Code for Phone Number */}
              {plan !== 'free' && (
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">Preferred Area Code</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                    placeholder="e.g., 302, 215, 610"
                  />
                  <p className="text-xs text-stone-500 mt-1">We'll provision a phone number in this area code for your Ring Ring service.</p>
                </div>
              )}

              {/* Shipping Address */}
              {delivery === 'shipping' && (
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">Shipping Address</label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={shippingAddress.line1}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                      placeholder="Street address"
                    />
                    <input
                      type="text"
                      value={shippingAddress.line2}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, line2: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                      placeholder="Apt, suite, etc. (optional)"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                        placeholder="State"
                      />
                      <input
                        type="text"
                        value={shippingAddress.zip}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                        className="px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                        placeholder="ZIP"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* E911 Address */}
              {plan !== 'free' && (
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">E911 Service Address</label>
                  <p className="text-xs text-stone-500 mb-3">This is where 911 calls will be routed. Must be the physical location of the phone.</p>
                  {delivery === 'shipping' && (
                    <label className="flex items-center gap-2 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useShippingForE911}
                        onChange={(e) => setUseShippingForE911(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-stone-600">Same as shipping address</span>
                    </label>
                  )}
                  {!useShippingForE911 && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={e911Address.line1}
                        onChange={(e) => setE911Address({ ...e911Address, line1: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                        placeholder="Street address"
                      />
                      <input
                        type="text"
                        value={e911Address.line2}
                        onChange={(e) => setE911Address({ ...e911Address, line2: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                        placeholder="Apt, suite, etc. (optional)"
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={e911Address.city}
                          onChange={(e) => setE911Address({ ...e911Address, city: e.target.value })}
                          className="px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={e911Address.state}
                          onChange={(e) => setE911Address({ ...e911Address, state: e.target.value })}
                          className="px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                          placeholder="State"
                        />
                        <input
                          type="text"
                          value={e911Address.zip}
                          onChange={(e) => setE911Address({ ...e911Address, zip: e.target.value })}
                          className="px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                          placeholder="ZIP"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
                <div className="text-sm font-bold text-stone-900 mb-3">Order Summary</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">{hardware === 'adapter' ? 'Ring Ring Bridge' : 'Starter Kit'}</span>
                    <span className="font-bold text-stone-900">${hardwarePrice}</span>
                  </div>
                  {plan !== 'free' && (
                    <div className="flex justify-between">
                      <span className="text-stone-600">
                        {plan === 'monthly' ? 'Monthly Plan' : 'Annual Plan (20% off)'}
                      </span>
                      <span className="font-bold text-stone-900">${planPrice.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-stone-200 pt-2 mt-2 flex justify-between">
                    <span className="font-bold text-stone-900">Total {plan !== 'free' && '(first payment)'}</span>
                    <span className="font-black text-stone-900 text-lg">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 max-w-2xl mx-auto">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 bg-white text-stone-700 border border-stone-200 rounded-full font-bold hover:bg-stone-50 transition"
            >
              ← Back
            </button>
          )}
          {step < 4 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="ml-auto px-8 py-3 bg-[#C4531A] text-white rounded-full font-bold hover:bg-[#a84313] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          )}
          {step === 4 && (
            <button
              onClick={handleCheckout}
              disabled={!canProceed() || loading}
              className="ml-auto px-8 py-3 bg-[#C4531A] text-white rounded-full font-bold hover:bg-[#a84313] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Complete Order →'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
