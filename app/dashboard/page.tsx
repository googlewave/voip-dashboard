'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import FriendsTab from './FriendsTab';
import TrustedContactsManager from '@/components/TrustedContactsManager';

interface Contact {
  id: string;
  name: string;
  phone?: string; // Legacy field
  phone_number?: string;
  contact_type?: string;
  sip_username?: string;
  friendship_id?: string;
  friend_device_id?: string;
  quick_dial_slot: number | null;
  device_id: string;
}

interface Device {
  id: string;
  name: string;
  status: boolean;
  created_at: string;
  sip_username: string | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  usage_cap_enabled: boolean;
  usage_cap_minutes: number | null;
  contacts?: Contact[];
}

interface UserProfile {
  plan: string;
  twilio_number: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

type FriendDevice = {
  id: string;
  name: string;
  sip_username: string | null;
  friendship_id: string;
  friend_email: string;
};

type Friendship = {
  id: string;
  friendEmail?: string;
  friendDevices?: Array<{
    id: string;
    name: string;
    sip_username: string | null;
  }>;
};

type Tab = 'devices' | 'contacts' | 'friends' | 'store' | 'subscription' | 'settings';

type Invoice = {
  id: string;
  amount: number;
  currency: string;
  status: string | null;
  date: number;
  description: string;
  pdf: string | null;
};

function SetupGuidePanel({ deviceId }: { deviceId: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/api/provision/auto/${deviceId}`
    : `/api/provision/auto/${deviceId}`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-stone-700 mb-2">Your provisioning URL</p>
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
          <code className="flex-1 text-xs text-stone-700 break-all font-mono">{url}</code>
          <button
            onClick={copy}
            className="shrink-0 px-3 py-1.5 bg-[#C4531A] text-white text-xs font-bold rounded-lg hover:bg-[#a84313] transition"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <ol className="space-y-3">
        {[
          { n: '1', text: 'Find your adapter\'s local IP — it\'s usually printed on the bottom label, or check your router\'s device list.' },
          { n: '2', text: 'Open a browser and go to http://[adapter-ip] to access the web interface.' },
          { n: '3', text: 'Log in (default credentials are on the label — usually admin / admin).' },
          { n: '4', text: 'Find the Provisioning or Auto Provision section (may be under Advanced Settings).' },
          { n: '5', text: 'Paste the URL above into the Config Server Path field.' },
          { n: '6', text: 'Click Save & Apply. The adapter will reboot and auto-configure itself — takes about 60 seconds.' },
          { n: '7', text: 'Pick up the phone — you should hear a dial tone. You\u2019re live!' },
        ].map(({ n, text }) => (
          <li key={n} className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-stone-800 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
            <p className="text-sm text-stone-600">{text}</p>
          </li>
        ))}
      </ol>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800"><strong>Need help?</strong> Email us at <a href="mailto:hello@ringring.club" className="underline">hello@ringring.club</a> and we\'ll walk you through it.</p>
      </div>
    </div>
  );
}

function DashboardInner() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('devices');

  // Device form
  const [newDeviceName, setNewDeviceName] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState<string | null>(null);

  // Store / invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const [friendDevices, setFriendDevices] = useState<FriendDevice[]>([]);

  // Quiet Hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [savingQuietHours, setSavingQuietHours] = useState(false);

  // Usage Cap
  const [usageCapEnabled, setUsageCapEnabled] = useState(false);
  const [usageCapMinutes, setUsageCapMinutes] = useState(60);
  const [savingUsageCap, setSavingUsageCap] = useState(false);

  const applySelectedDevice = (device: Device | null) => {
    setSelectedDevice(device);
    if (!device) return;
    setQuietHoursEnabled(device.quiet_hours_enabled || false);
    setQuietHoursStart(device.quiet_hours_start || '21:00');
    setQuietHoursEnd(device.quiet_hours_end || '07:00');
    setUsageCapEnabled(device.usage_cap_enabled || false);
    setUsageCapMinutes(device.usage_cap_minutes || 60);
  };

  async function fetchFriendDevices() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/friends', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      
      // Flatten friend devices with friendship_id
      const allFriendDevices: FriendDevice[] = [];
      (data.friendships as Friendship[] | undefined || []).forEach((friendship) => {
        (friendship.friendDevices || []).forEach((device) => {
          allFriendDevices.push({
            ...device,
            friendship_id: friendship.id,
            friend_email: friendship.friendEmail || '',
          });
        });
      });
      
      setFriendDevices(allFriendDevices);
    } catch (error) {
      console.error('Error fetching friend devices:', error);
    }
  }

  async function fetchData(userId: string) {
    const { data: profileData } = await supabase
      .from('users')
      .select('plan, twilio_number, stripe_customer_id, stripe_sub_id')
      .eq('id', userId)
      .single();

    if (profileData) setProfile({
      ...profileData,
      stripe_subscription_id: profileData.stripe_sub_id,
    });

    const { data: devicesData } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!devicesData) return;

    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId);

    const devicesWithContacts = devicesData.map((device) => ({
      ...device,
      contacts: (contactsData || []).filter((c) => c.device_id === device.id),
    }));

    setDevices(devicesWithContacts);

    if (selectedDevice) {
      const updated = devicesWithContacts.find((d) => d.id === selectedDevice.id);
      if (updated) applySelectedDevice(updated);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else {
        setUser(session.user);
        fetchData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login');
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const addDevice = async () => {
    if (!newDeviceName.trim() || !user) return;
    setAddingDevice(true);
    const { data, error } = await supabase
      .from('devices')
      .insert({ 
        name: newDeviceName.trim(), 
        status: false, 
        user_id: user.id,
        quiet_hours_enabled: false,
        usage_cap_enabled: false,
      })
      .select()
      .single();
    if (!error && data) {
      setNewDeviceName('');
      setShowSetupGuide(data.id);
      await fetchData(user.id);
    }
    setAddingDevice(false);
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Delete this device and all its contacts?')) return;
    await supabase.from('contacts').delete().eq('device_id', id);
    await supabase.from('devices').delete().eq('id', id);
    if (selectedDevice?.id === id) applySelectedDevice(null);
    if (user) await fetchData(user.id);
  };

  const toggleDevice = async (id: string, currentStatus: boolean) => {
    await supabase.from('devices').update({ status: !currentStatus }).eq('id', id);
    if (user) await fetchData(user.id);
  };

  const saveQuietHours = async () => {
    if (!selectedDevice) return;
    setSavingQuietHours(true);
    await supabase.from('devices').update({
      quiet_hours_enabled: quietHoursEnabled,
      quiet_hours_start: quietHoursStart,
      quiet_hours_end: quietHoursEnd,
    }).eq('id', selectedDevice.id);
    if (user) await fetchData(user.id);
    setSavingQuietHours(false);
  };

  const saveUsageCap = async () => {
    if (!selectedDevice) return;
    setSavingUsageCap(true);
    await supabase.from('devices').update({
      usage_cap_enabled: usageCapEnabled,
      usage_cap_minutes: usageCapMinutes,
    }).eq('id', selectedDevice.id);
    if (user) await fetchData(user.id);
    setSavingUsageCap(false);
  };

  const manageSubscription = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await fetch('/api/billing/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices ?? []);
      }
    } finally {
      setLoadingInvoices(false);
    }
  };

  const startAdditionalCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await fetch('/api/billing/create-checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setCheckingOut(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/landing');
  };

  if (!user) return null;

  const isPaid = profile?.plan === 'monthly' || profile?.plan === 'annual';

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <button onClick={() => router.push('/landing')} className="text-xl font-black text-stone-900">
                Ring Ring
              </button>
              <p className="text-[10px] text-stone-400 font-medium">🔒 Parent Portal - Adult Supervision Required</p>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-500">
              <button onClick={() => setActiveTab('devices')} className={activeTab === 'devices' ? 'text-stone-900' : 'hover:text-stone-800 transition'}>
                Devices
              </button>
              <button
                onClick={() => {
                  setActiveTab('contacts');
                  if (user) void fetchFriendDevices();
                }}
                className={activeTab === 'contacts' ? 'text-stone-900' : 'hover:text-stone-800 transition'}
              >
                Contacts
              </button>
              <button onClick={() => setActiveTab('friends')} className={activeTab === 'friends' ? 'text-stone-900' : 'hover:text-stone-800 transition'}>
                Friends
              </button>
              <button
                onClick={() => { setActiveTab('store'); void fetchInvoices(); }}
                className={activeTab === 'store' ? 'text-stone-900' : 'hover:text-stone-800 transition'}
              >
                Store
              </button>
              <button onClick={() => setActiveTab('subscription')} className={activeTab === 'subscription' ? 'text-stone-900' : 'hover:text-stone-800 transition'}>
                Subscription
              </button>
              <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-stone-900' : 'hover:text-stone-800 transition'}>
                Settings
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {isPaid && (
              <span className="text-xs bg-[#C4531A] text-white font-bold px-3 py-1.5 rounded-full">
                {profile?.plan === 'annual' ? 'Annual' : 'Monthly'}
              </span>
            )}
            <button onClick={signOut} className="text-sm text-stone-500 hover:text-stone-800 transition">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-stone-900 mb-2">Welcome back!</h1>
          <p className="text-stone-500">{user.email}</p>
        </div>

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <div className="space-y-6">

            {devices.length > 0 ? (
              <>
                {/* Device List */}
                <div className="bg-white rounded-3xl border-2 border-stone-100 overflow-hidden">
                  <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                    <h2 className="text-lg font-black text-stone-900">Your Devices ({devices.length})</h2>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {devices.map((device) => (
                      <div key={device.id} className="p-6 hover:bg-stone-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => toggleDevice(device.id, device.status)}
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                                device.status ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400'
                              }`}
                            >
                              {device.status ? '✓' : '○'}
                            </button>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black text-stone-900">{device.name}</h3>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  device.status ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                                }`}>
                                  {device.status ? 'Online' : 'Offline'}
                                </span>
                                {!device.sip_username && (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                    Pending Activation
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-stone-500">
                                <span>{device.contacts?.length ?? 0} contacts</span>
                                {device.quiet_hours_enabled && <span>🌙 Quiet hours</span>}
                                {device.usage_cap_enabled && <span>⏱️ Usage cap</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {device.sip_username && (
                              <button
                                onClick={() => setShowSetupGuide(showSetupGuide === device.id ? null : device.id)}
                                className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition text-sm"
                              >
                                Setup Guide
                              </button>
                            )}
                            <button
                              onClick={() => {
                                applySelectedDevice(device);
                                setActiveTab('contacts');
                                void fetchFriendDevices();
                              }}
                              className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition text-sm"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => deleteDevice(device.id)}
                              className="px-4 py-2 text-red-600 hover:bg-red-50 font-bold rounded-xl transition text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Setup Guide (inline) */}
                        {showSetupGuide === device.id && device.sip_username && (
                          <div className="mt-4 pt-4 border-t border-stone-100">
                            <SetupGuidePanel deviceId={device.id} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add another number CTA */}
                <div className="bg-amber-50 rounded-3xl p-6 border-2 border-amber-200 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-amber-900 mb-1">Want another phone line?</h3>
                    <p className="text-sm text-amber-800">Add a second Ring Ring number for another room or child — each is its own plan.</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('store'); void fetchInvoices(); }}
                    className="shrink-0 px-5 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition text-sm"
                  >
                    Browse Plans →
                  </button>
                </div>
              </>
            ) : profile?.twilio_number ? (
              <>
                {/* Has number, needs a device */}
                <div className="bg-white rounded-3xl p-8 border-2 border-stone-100">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-bold px-3 py-1.5 rounded-full mb-4">
                      <span>✓</span> Phone number active: {profile.twilio_number}
                    </div>
                    <h2 className="text-2xl font-black text-stone-900 mb-2">Set Up Your Ring Ring Bridge</h2>
                    <p className="text-stone-500">Give your adapter a name so you can find it easily — like "Kitchen Phone" or "Bedroom Phone."</p>
                  </div>
                  <div className="flex gap-3">
                    <input
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900"
                      placeholder="e.g. Kitchen Phone"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDevice()}
                      autoFocus
                    />
                    <button
                      onClick={addDevice}
                      disabled={addingDevice || !newDeviceName.trim()}
                      className="px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50"
                    >
                      {addingDevice ? 'Registering...' : 'Register Device'}
                    </button>
                  </div>
                </div>

                {/* Setup guide steps (pre-registration) */}
                <div className="bg-white rounded-3xl p-8 border-2 border-stone-100">
                  <h3 className="text-lg font-black text-stone-900 mb-6">How to connect your Ring Ring Bridge</h3>
                  <ol className="space-y-5">
                    {[
                      { n: '1', title: 'Connect to your router', desc: 'Plug one end of an ethernet cable into your Ring Ring Bridge adapter, the other end into your home router.' },
                      { n: '2', title: 'Connect your phone', desc: 'Plug your analog phone into Port 1 (labeled "Phone 1") on the adapter.' },
                      { n: '3', title: 'Power it on', desc: 'Connect the power adapter and wait about 30 seconds for the device to boot up.' },
                      { n: '4', title: 'Register it above', desc: 'Give your device a name in the field above and click Register Device. Our team will activate it shortly.' },
                      { n: '5', title: 'Enter the provisioning URL', desc: 'Once activated, come back here — you\'ll see a Setup Guide button with your unique URL to paste into the adapter\'s web interface.' },
                    ].map(({ n, title, desc }) => (
                      <li key={n} className="flex gap-4">
                        <span className="w-8 h-8 rounded-full bg-[#C4531A] text-white font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
                        <div>
                          <p className="font-bold text-stone-900">{title}</p>
                          <p className="text-sm text-stone-500 mt-0.5">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            ) : (
              <>
                {/* No number, no device — show basic add form */}
                <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                  <h2 className="text-lg font-black text-stone-900 mb-4">Add a Device</h2>
                  <div className="flex gap-3">
                    <input
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900"
                      placeholder="Device name (e.g., Kitchen Phone)"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDevice()}
                    />
                    <button
                      onClick={addDevice}
                      disabled={addingDevice || !newDeviceName.trim()}
                      className="px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50"
                    >
                      {addingDevice ? 'Adding...' : 'Add Device'}
                    </button>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-3xl p-6 border-2 border-amber-200">
                  <h3 className="font-black text-amber-900 mb-2">Get a Ring Ring number first</h3>
                  <p className="text-sm text-amber-800 mb-4">A phone number is required to make and receive calls outside the Ring Ring network.</p>
                  <button onClick={() => router.push('/buy')} className="px-5 py-2.5 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition text-sm">
                    See Plans →
                  </button>
                </div>
              </>
            )}

            {/* Post-registration setup guide */}
            {showSetupGuide && devices.find(d => d.id === showSetupGuide) && (() => {
              const newDevice = devices.find(d => d.id === showSetupGuide)!;
              return (
                <div className="bg-green-50 rounded-3xl p-6 border-2 border-green-200">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-lg font-bold">✓</div>
                      <div>
                        <h3 className="font-black text-stone-900">{newDevice.name} registered!</h3>
                        <p className="text-sm text-stone-500">Next: activate and provision your physical adapter</p>
                      </div>
                    </div>
                    <button onClick={() => setShowSetupGuide(null)} className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
                  </div>
                  {newDevice.sip_username ? (
                    <SetupGuidePanel deviceId={newDevice.id} />
                  ) : (
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                      <p className="text-sm font-bold text-amber-800 mb-1">⏳ Pending activation</p>
                      <p className="text-sm text-amber-700">Your Ring Ring team will activate this device within a few hours. Once active, a Setup Guide button will appear here with your provisioning URL.</p>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">

            {selectedDevice ? (
              <>
                {/* Device Selector */}
                <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                  <label className="block text-sm font-bold text-stone-900 mb-2">Selected Device</label>
                  <select
                    value={selectedDevice.id}
                    onChange={(e) => {
                      const device = devices.find((d) => d.id === e.target.value);
                      if (device) applySelectedDevice(device);
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none font-medium"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Trusted Contacts Manager */}
                <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                  <TrustedContactsManager
                    deviceId={selectedDevice.id}
                    userId={user.id}
                    deviceName={selectedDevice.name}
                    friendDevices={friendDevices}
                    isPaid={isPaid}
                  />
                </div>
              </>
            ) : (
              <div className="bg-white rounded-3xl p-16 border-2 border-stone-100 text-center">
                <div className="text-6xl mb-4">📞</div>
                <p className="text-xl font-black text-stone-900 mb-2">No device selected</p>
                <p className="text-stone-500">Go to Devices tab and click Manage on a device</p>
              </div>
            )}

          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <FriendsTab user={user} />
        )}

        {/* Store Tab */}
        {activeTab === 'store' && (
          <div className="space-y-6">

            {/* Add Another Number */}
            <div className="bg-white rounded-3xl p-8 border-2 border-stone-100">
              <h2 className="text-2xl font-black text-stone-900 mb-2">Add Another Phone Number</h2>
              <p className="text-stone-500 mb-8">Each Ring Ring number is its own line — perfect for a second child, another room, or a family member who lives far away.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly */}
                <div className="rounded-2xl border-2 border-stone-200 p-6 flex flex-col">
                  <div className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-1">Monthly</div>
                  <div className="text-4xl font-black text-stone-900 mb-1">$8.95<span className="text-lg font-bold text-stone-400">/mo</span></div>
                  <p className="text-sm text-stone-500 mb-6">Unlimited calls to any US number. Cancel anytime.</p>
                  <ul className="space-y-2 text-sm text-stone-600 mb-6 flex-1">
                    {['Dedicated phone number', 'Trusted contact list', 'Quick dial keys', 'Quiet Hours + Usage Cap', 'Real E911'].map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={startAdditionalCheckout}
                    disabled={checkingOut}
                    className="w-full px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50"
                  >
                    {checkingOut ? 'Redirecting...' : 'Add Monthly Line'}
                  </button>
                </div>

                {/* Annual */}
                <div className="rounded-2xl border-2 border-[#C4531A] p-6 flex flex-col relative">
                  <div className="absolute -top-3 left-6 bg-[#C4531A] text-white text-xs font-black px-3 py-1 rounded-full">SAVE 20%</div>
                  <div className="text-sm font-bold text-[#C4531A] uppercase tracking-wide mb-1">Annual</div>
                  <div className="text-4xl font-black text-stone-900 mb-1">$85.80<span className="text-lg font-bold text-stone-400">/yr</span></div>
                  <p className="text-sm text-stone-500 mb-6">That&apos;s $7.15/month — two months free vs monthly.</p>
                  <ul className="space-y-2 text-sm text-stone-600 mb-6 flex-1">
                    {['Everything in Monthly', 'Two months free', 'Priority support'].map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#C4531A]/10 text-[#C4531A] flex items-center justify-center text-xs">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={startAdditionalCheckout}
                    disabled={checkingOut}
                    className="w-full px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition disabled:opacity-50"
                  >
                    {checkingOut ? 'Redirecting...' : 'Add Annual Line'}
                  </button>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="bg-white rounded-3xl border-2 border-stone-100 overflow-hidden">
              <div className="p-6 border-b border-stone-100">
                <h2 className="text-lg font-black text-stone-900">Order History</h2>
              </div>
              {loadingInvoices ? (
                <div className="p-12 text-center text-stone-400 text-sm">Loading orders…</div>
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">🧾</div>
                  <p className="text-stone-500 font-medium">No orders yet</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 truncate">{inv.description}</p>
                        <p className="text-sm text-stone-500">
                          {new Date(inv.date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="font-black text-stone-900">
                            ${(inv.amount / 100).toFixed(2)}
                          </p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                            inv.status === 'open' ? 'bg-amber-100 text-amber-700' :
                            'bg-stone-100 text-stone-500'
                          }`}>
                            {inv.status ?? 'unknown'}
                          </span>
                        </div>
                        {inv.pdf && (
                          <a
                            href={inv.pdf}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-[#C4531A] hover:underline"
                          >
                            PDF ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            
            {selectedDevice ? (
              <>
                {/* Device Selector */}
                <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                  <label className="block text-sm font-bold text-stone-900 mb-2">Selected Device</label>
                  <select
                    value={selectedDevice.id}
                    onChange={(e) => {
                      const device = devices.find(d => d.id === e.target.value);
                      if (device) setSelectedDevice(device);
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none font-medium"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Kill Switch */}
                <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-black text-stone-900 mb-1">🔴 Digital Kill Switch</h2>
                      <p className="text-sm text-stone-500">Take the phone offline instantly. Back on just as fast.</p>
                    </div>
                    <button
                      onClick={() => toggleDevice(selectedDevice.id, selectedDevice.status)}
                      className={`px-6 py-3 font-bold rounded-xl transition ${
                        selectedDevice.status
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {selectedDevice.status ? 'Turn Off' : 'Turn On'}
                    </button>
                  </div>
                  <div className={`px-4 py-3 rounded-xl ${
                    selectedDevice.status ? 'bg-green-50 text-green-800' : 'bg-stone-50 text-stone-600'
                  }`}>
                    <p className="text-sm font-bold">
                      {selectedDevice.status ? '✓ Device is online and can make/receive calls' : '○ Device is offline'}
                    </p>
                  </div>
                </div>

                {/* Quiet Hours */}
                {isPaid && (
                  <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                    <h2 className="text-lg font-black text-stone-900 mb-1">🌙 Quiet Hours</h2>
                    <p className="text-sm text-stone-500 mb-6">Schedule silence during homework, dinner, or bedtime.</p>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quietHoursEnabled}
                          onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-stone-300"
                        />
                        <span className="font-bold text-stone-900">Enable quiet hours</span>
                      </label>
                      {quietHoursEnabled && (
                        <div className="grid grid-cols-2 gap-4 pl-8">
                          <div>
                            <label className="block text-sm font-bold text-stone-900 mb-2">Start time</label>
                            <input
                              type="time"
                              value={quietHoursStart}
                              onChange={(e) => setQuietHoursStart(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-stone-900 mb-2">End time</label>
                            <input
                              type="time"
                              value={quietHoursEnd}
                              onChange={(e) => setQuietHoursEnd(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                            />
                          </div>
                        </div>
                      )}
                      <button
                        onClick={saveQuietHours}
                        disabled={savingQuietHours}
                        className="px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50"
                      >
                        {savingQuietHours ? 'Saving...' : 'Save Quiet Hours'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Usage Cap */}
                {isPaid && (
                  <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                    <h2 className="text-lg font-black text-stone-900 mb-1">⏱️ Daily Usage Cap</h2>
                    <p className="text-sm text-stone-500 mb-6">Set daily talk limits when needed — and override them on snow days.</p>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={usageCapEnabled}
                          onChange={(e) => setUsageCapEnabled(e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-stone-300"
                        />
                        <span className="font-bold text-stone-900">Enable usage cap</span>
                      </label>
                      {usageCapEnabled && (
                        <div className="pl-8">
                          <label className="block text-sm font-bold text-stone-900 mb-2">Minutes per day</label>
                          <input
                            type="number"
                            min="1"
                            max="1440"
                            value={usageCapMinutes}
                            onChange={(e) => setUsageCapMinutes(parseInt(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                          />
                        </div>
                      )}
                      <button
                        onClick={saveUsageCap}
                        disabled={savingUsageCap}
                        className="px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50"
                      >
                        {savingUsageCap ? 'Saving...' : 'Save Usage Cap'}
                      </button>
                    </div>
                  </div>
                )}

                {!isPaid && (
                  <div className="bg-amber-50 rounded-3xl p-6 border-2 border-amber-200">
                    <h3 className="text-lg font-black text-amber-900 mb-2">Upgrade to unlock advanced features</h3>
                    <p className="text-sm text-amber-800 mb-4">Quiet Hours and Usage Caps are available on paid plans.</p>
                    <button
                      onClick={() => router.push('/buy')}
                      className="px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition"
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}

              </>
            ) : (
              <div className="bg-white rounded-3xl p-16 border-2 border-stone-100 text-center">
                <div className="text-6xl mb-4">⚙️</div>
                <p className="text-xl font-black text-stone-900 mb-2">No device selected</p>
                <p className="text-stone-500">Go to Devices tab to add or select a device first</p>
              </div>
            )}

          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-3xl p-8 border-2 border-stone-100">
              <h2 className="text-2xl font-black text-stone-900 mb-6">Your Plan</h2>
              
              {isPaid ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-orange-50 rounded-2xl border-2 border-[#C4531A]">
                    <div>
                      <div className="text-sm font-bold text-[#C4531A] uppercase tracking-wide mb-1">
                        {profile?.plan === 'annual' ? 'Annual Plan' : 'Monthly Plan'}
                      </div>
                      <div className="text-3xl font-black text-stone-900">
                        {profile?.plan === 'annual' ? '$85.80/year' : '$8.95/month'}
                      </div>
                      <p className="text-sm text-stone-600 mt-2">Unlimited calls to any US number</p>
                    </div>
                    <div className="text-5xl">🔔</div>
                  </div>

                  {/* Phone Number */}
                  {profile?.twilio_number && (
                    <div className="p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
                      <h3 className="text-sm font-bold text-blue-900 mb-2">📞 Your Ring Ring Number</h3>
                      <div className="text-2xl font-black text-blue-900 font-mono">{profile.twilio_number}</div>
                      <p className="text-sm text-blue-700 mt-2">This is your dedicated phone number for making and receiving calls.</p>
                    </div>
                  )}
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="text-stone-600">Unlimited devices</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="text-stone-600">Unlimited approved contacts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="text-stone-600">Quick dial shortcuts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="text-stone-600">Quiet Hours scheduling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="text-stone-600">Digital Kill Switch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="text-stone-600">Daily usage caps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="text-stone-600">Real E911 with verified address</span>
                    </div>
                  </div>

                  <button
                    onClick={manageSubscription}
                    className="w-full px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition"
                  >
                    Manage Subscription
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 bg-stone-50 rounded-2xl border-2 border-stone-200">
                    <div className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-1">Starter Plan</div>
                    <div className="text-3xl font-black text-stone-900">Free</div>
                    <p className="text-sm text-stone-600 mt-2">Ring Ring → Ring Ring calls only</p>
                  </div>

                  <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-200">
                    <h3 className="font-black text-amber-900 mb-2">Upgrade to Make It Ring Ring</h3>
                    <p className="text-sm text-amber-800 mb-4">Get unlimited calls to any US number, plus advanced features like Quiet Hours and Usage Caps.</p>
                    <button
                      onClick={() => router.push('/buy')}
                      className="px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition"
                    >
                      Upgrade for $8.95/month
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}


      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-stone-500">Loading...</div>}>
      <DashboardInner />
    </Suspense>
  );
}
