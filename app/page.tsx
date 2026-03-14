'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface Contact {
  id: string;
  name: string;
  phone: string;
  quick_dial_slot: number | null;
  device_id: string;
}

interface Device {
  id: string;
  name: string;
  status: boolean;
  created_at: string;
  sip_username: string | null;
  contacts?: Contact[];
}

interface UserProfile {
  plan: string;
  twilio_number: string | null;
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactSlot, setNewContactSlot] = useState<string>('');
  const [contactLoading, setContactLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (searchParams.get('upgraded') === 'true') {
      setShowUpgradedBanner(true);
      setTimeout(() => setShowUpgradedBanner(false), 5000);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/landing');
      else {
        setUser(session.user);
        fetchData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/landing');
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('users')
      .select('plan, twilio_number')
      .eq('id', userId)
      .single();

    if (profileData) setProfile(profileData);

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
      if (updated) setSelectedDevice(updated);
    }
  };

  const addDevice = async () => {
    if (!newDeviceName.trim() || !user) return;
    setAddingDevice(true);
    const { error } = await supabase
      .from('devices')
      .insert({ name: newDeviceName.trim(), status: false, user_id: user.id });
    if (!error) {
      setNewDeviceName('');
      await fetchData(user.id);
    }
    setAddingDevice(false);
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Delete this device and all its contacts?')) return;
    await supabase.from('contacts').delete().eq('device_id', id);
    await supabase.from('devices').delete().eq('id', id);
    if (selectedDevice?.id === id) setSelectedDevice(null);
    if (user) await fetchData(user.id);
  };

  const addContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim() || !selectedDevice || !user) return;
    setContactLoading(true);

    if (newContactSlot) {
      await supabase
        .from('contacts')
        .update({ quick_dial_slot: null })
        .eq('device_id', selectedDevice.id)
        .eq('quick_dial_slot', parseInt(newContactSlot));
    }

    await supabase.from('contacts').insert({
      device_id: selectedDevice.id,
      user_id: user.id,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      quick_dial_slot: newContactSlot ? parseInt(newContactSlot) : null,
    });

    setNewContactName('');
    setNewContactPhone('');
    setNewContactSlot('');
    await fetchData(user.id);
    setContactLoading(false);
  };

  const deleteContact = async (contactId: string) => {
    await supabase.from('contacts').delete().eq('id', contactId);
    if (user) await fetchData(user.id);
  };

  const assignSlot = async (contactId: string, slot: number | null) => {
    if (!selectedDevice) return;
    if (slot !== null) {
      await supabase
        .from('contacts')
        .update({ quick_dial_slot: null })
        .eq('device_id', selectedDevice.id)
        .eq('quick_dial_slot', slot);
    }
    await supabase.from('contacts').update({ quick_dial_slot: slot }).eq('id', contactId);
    if (user) await fetchData(user.id);
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    const res = await fetch('/api/billing/create-checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setUpgrading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/landing');
  };

  if (!mounted || !user) return null;

  const isPro = profile?.plan === 'pro';
  const selectedContacts = selectedDevice?.contacts ?? [];
  const quickDialSlots = Array.from({ length: 9 }, (_, i) => ({
    slot: i + 1,
    contact: selectedContacts.find((c) => c.quick_dial_slot === i + 1) ?? null,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-6xl mx-auto">

        {/* Upgraded Banner */}
        {showUpgradedBanner && (
          <div className="mb-4 p-4 bg-green-800/60 border border-green-500 rounded-xl text-green-200 font-medium text-sm flex items-center gap-2">
            🎉 You're now on Pro! Your phone number will be assigned shortly.
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">VoIP Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {isPro ? (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className="bg-yellow-500 text-yellow-950 text-xs font-bold px-3 py-1 rounded-full">
                  ⭐ PRO
                </span>
                {profile?.twilio_number && (
                  <span className="text-sm text-slate-300 font-mono bg-slate-700 px-3 py-1 rounded-lg">
                    📞 {profile.twilio_number}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 text-sm"
              >
                {upgrading ? 'Redirecting...' : '⭐ Upgrade to Pro'}
              </button>
            )}
            <button
              onClick={signOut}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Pro upsell banner */}
        {!isPro && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-700/50 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-yellow-300">Get a dedicated phone number with Pro</p>
              <p className="text-sm text-slate-400 mt-0.5">
                Make & receive calls from a real number • Unlimited devices • $9/mo
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="shrink-0 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold rounded-lg transition text-sm disabled:opacity-50"
            >
              {upgrading ? '...' : 'Upgrade — $9/mo'}
            </button>
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT — Devices */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Add Device</h2>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Office Phone"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDevice()}
                />
                <button
                  onClick={addDevice}
                  disabled={addingDevice || !newDeviceName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                >
                  {addingDevice ? '...' : 'Add'}
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-sm font-semibold text-slate-300">My Devices ({devices.length})</h2>
              </div>
              {devices.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No devices yet</div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      onClick={() => setSelectedDevice(device)}
                      className={`p-4 cursor-pointer hover:bg-slate-700/50 transition ${
                        selectedDevice?.id === device.id
                          ? 'bg-blue-900/30 border-l-4 border-blue-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${device.status ? 'bg-green-400' : 'bg-slate-500'}`} />
                          <div>
                            <p className="text-sm font-medium">{device.name}</p>
                            <p className="text-xs text-slate-400">
                              {device.sip_username ? '✅ SIP Active' : '⚪ No SIP'} •{' '}
                              {device.contacts?.length ?? 0} contact{device.contacts?.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteDevice(device.id); }}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/30 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Quick Dial + Contacts */}
          <div className="lg:col-span-2">
            {selectedDevice ? (
              <div className="space-y-4">

                {/* Quick Dial Grid */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <h2 className="text-sm font-semibold text-slate-300 mb-3">
                    ⚡ Quick Dial — {selectedDevice.name}
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {quickDialSlots.map(({ slot, contact }) => (
                      <div
                        key={slot}
                        className={`rounded-lg p-3 border text-center min-h-[80px] flex flex-col justify-center ${
                          contact
                            ? 'bg-blue-900/30 border-blue-700'
                            : 'bg-slate-700/30 border-slate-600 border-dashed'
                        }`}
                      >
                        <div className="text-xs text-slate-400 mb-1 font-medium">Slot {slot}</div>
                        {contact ? (
                          <>
                            <p className="text-sm font-semibold truncate">{contact.name}</p>
                            <p className="text-xs text-slate-400 font-mono truncate">{contact.phone}</p>
                            <button
                              onClick={() => assignSlot(contact.id, null)}
                              className="mt-1.5 text-xs text-red-400 hover:text-red-300 transition"
                            >
                              Clear
                            </button>
                          </>
                        ) : (
                          <p className="text-slate-500 text-xs">Empty</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Contact */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <h2 className="text-sm font-semibold text-slate-300 mb-3">Add Contact</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Name (e.g. Mom)"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                    />
                    <input
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Phone number"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <select
                        value={newContactSlot}
                        onChange={(e) => setNewContactSlot(e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">No quick dial</option>
                        {quickDialSlots.map(({ slot, contact }) => (
                          <option key={slot} value={slot}>
                            Slot {slot}{contact ? ' (taken)' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={addContact}
                        disabled={contactLoading || !newContactName.trim() || !newContactPhone.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                      >
                        {contactLoading ? '...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contact List */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="p-4 border-b border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-300">
                      All Contacts ({selectedContacts.length})
                    </h2>
                  </div>
                  {selectedContacts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      No contacts yet — add one above
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700">
                      {selectedContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="p-4 flex items-center justify-between hover:bg-slate-700/30"
                        >
                          <div className="flex items-center gap-3">
                            {contact.quick_dial_slot !== null && (
                              <span className="text-xs bg-blue-900 text-blue-300 font-bold px-2 py-0.5 rounded">
                                ⚡ {contact.quick_dial_slot}
                              </span>
                            )}
                            <div>
                              <p className="text-sm font-medium">{contact.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{contact.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={contact.quick_dial_slot ?? ''}
                              onChange={(e) =>
                                assignSlot(contact.id, e.target.value ? parseInt(e.target.value) : null)
                              }
                              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
                            >
                              <option value="">No slot</option>
                              {Array.from({ length: 9 }, (_, i) => i + 1).map((s) => (
                                <option key={s} value={s}>Slot {s}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => deleteContact(contact.id)}
                              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/30 transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-16 text-center">
                <p className="text-4xl mb-3">👈</p>
                <p className="text-lg font-medium text-slate-400">Select a device</p>
                <p className="text-sm mt-1 text-slate-500">to manage contacts and quick dial slots</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
