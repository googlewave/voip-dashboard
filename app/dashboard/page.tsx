'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import FriendsTab from './FriendsTab';

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

type Tab = 'devices' | 'contacts' | 'friends' | 'subscription' | 'settings';

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
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionDeviceId, setProvisionDeviceId] = useState<string | null>(null);

  // Contact form
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactSlot, setNewContactSlot] = useState<string>('');
  const [contactLoading, setContactLoading] = useState(false);
  const [slotSwapModal, setSlotSwapModal] = useState<{
    contactId: string;
    slot: number;
    existingContact: Contact;
  } | null>(null);
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [contactType, setContactType] = useState<'ring_ring_friend' | 'phone_number'>('ring_ring_friend');
  const [selectedFriendDevice, setSelectedFriendDevice] = useState('');
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
      setProvisionDeviceId(data.id);
      setShowProvisionModal(true);
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

  const addContact = async () => {
    if (!selectedDevice || !user) return;
    
    // Validate based on contact type
    if (contactType === 'ring_ring_friend') {
      if (!newContactName.trim() || !selectedFriendDevice) return;
    } else {
      if (!newContactName.trim() || !newContactPhone.trim()) return;
    }
    
    setContactLoading(true);

    if (newContactSlot) {
      await supabase
        .from('contacts')
        .update({ quick_dial_slot: null })
        .eq('device_id', selectedDevice.id)
        .eq('quick_dial_slot', parseInt(newContactSlot));
    }

    // Prepare contact data based on type
    const contactData: {
      device_id: string;
      user_id: string;
      name: string;
      contact_type: 'ring_ring_friend' | 'phone_number';
      quick_dial_slot: number | null;
      sip_username?: string;
      friend_device_id?: string;
      friendship_id?: string;
      phone_number?: string;
    } = {
      device_id: selectedDevice.id,
      user_id: user.id,
      name: newContactName.trim(),
      contact_type: contactType,
      quick_dial_slot: newContactSlot ? parseInt(newContactSlot) : null,
    };

    if (contactType === 'ring_ring_friend') {
      // Get friend device details
      const friendDevice = friendDevices.find(d => d.id === selectedFriendDevice);
      if (friendDevice) {
        contactData.sip_username = friendDevice.sip_username ?? undefined;
        contactData.friend_device_id = friendDevice.id;
        // Find friendship_id from friendDevices metadata
        contactData.friendship_id = friendDevice.friendship_id;
      }
    } else {
      contactData.phone_number = newContactPhone.trim();
    }

    await supabase.from('contacts').insert(contactData);

    setNewContactName('');
    setNewContactPhone('');
    setNewContactSlot('');
    setSelectedFriendDevice('');
    setContactLoading(false);
    if (user) await fetchData(user.id);
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Remove this contact?')) return;
    await supabase.from('contacts').delete().eq('id', contactId);
    if (user) await fetchData(user.id);
  };

  const applySlotAssignment = async (contactId: string, slot: number, displacedContactId?: string) => {
    if (!selectedDevice || !user) return;
    setContactLoading(true);

    if (displacedContactId) {
      await supabase
        .from('contacts')
        .update({ quick_dial_slot: null })
        .eq('id', displacedContactId);
    }

    await supabase
      .from('contacts')
      .update({ quick_dial_slot: slot })
      .eq('id', contactId);

    await fetchData(user.id);
    setContactLoading(false);
  };

  const clearSlot = async (contactId: string) => {
    if (!user) return;
    setContactLoading(true);
    await supabase.from('contacts').update({ quick_dial_slot: null }).eq('id', contactId);
    await fetchData(user.id);
    setContactLoading(false);
  };

  const requestSlotAssignment = (contactId: string, slot: number) => {
    const existing = selectedContacts.find((c) => c.quick_dial_slot === slot && c.id !== contactId);
    if (existing) {
      setSlotSwapModal({ contactId, slot, existingContact: existing });
      return;
    }
    void applySlotAssignment(contactId, slot);
  };

  const handleContactDragStart = (contactId: string) => {
    setDraggedContactId(contactId);
  };

  const handleSlotDragOver = (slot: number) => {
    setDragOverSlot(slot);
  };

  const handleSlotDrop = (slot: number) => {
    if (!draggedContactId) return;
    requestSlotAssignment(draggedContactId, slot);
    setDraggedContactId(null);
    setDragOverSlot(null);
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

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/landing');
  };

  if (!user) return null;

  const isPaid = profile?.plan === 'monthly' || profile?.plan === 'annual';
  const selectedContacts = selectedDevice?.contacts ?? [];
  const safeContacts = [...selectedContacts].sort((a, b) => a.name.localeCompare(b.name));
  const quickDialSlots = Array.from({ length: 9 }, (_, i) => ({
    slot: i + 1,
    contact: selectedContacts.find((c) => c.quick_dial_slot === i + 1) ?? null,
  }));
  const assignedSlotCount = quickDialSlots.filter(({ contact }) => contact !== null).length;

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
            
            {/* Add Device */}
            <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
              <h2 className="text-lg font-black text-stone-900 mb-4">Add a Device</h2>
              <div className="flex gap-3">
                <input
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
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

            {/* Device List */}
            <div className="bg-white rounded-3xl border-2 border-stone-100 overflow-hidden">
              <div className="p-6 border-b border-stone-100">
                <h2 className="text-lg font-black text-stone-900">Your Devices ({devices.length})</h2>
              </div>
              {devices.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-4">📞</div>
                  <p className="text-stone-500 text-lg font-medium">No devices yet</p>
                  <p className="text-stone-400 text-sm mt-1">Add your first device above to get started</p>
                </div>
              ) : (
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
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-stone-900">{device.name}</h3>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                device.status ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                              }`}>
                                {device.status ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-stone-500">
                              <span>{device.contacts?.length ?? 0} contacts</span>
                              {device.quiet_hours_enabled && <span>🌙 Quiet hours</span>}
                              {device.usage_cap_enabled && <span>⏱️ Usage cap</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setProvisionDeviceId(device.id); setShowProvisionModal(true); }}
                            className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition text-sm"
                          >
                            Setup
                          </button>
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
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                      const device = devices.find(d => d.id === e.target.value);
                      if (device) applySelectedDevice(device);
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none font-medium"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Safe Dial Dashboard */}
                <div className="bg-[#1f2229] rounded-3xl p-6 border-2 border-slate-700 text-slate-100">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-black">Safe Dial Dashboard</h2>
                      <p className="text-xs text-slate-400 mt-1">Safe list is always allowed inbound. Only keys 1–9 are assignable for outgoing quick dial.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Active Dials</p>
                      <p className="text-xl font-black">{assignedSlotCount} / 9</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-1 rounded-2xl bg-slate-800/70 border border-slate-600 p-4">
                      <h3 className="font-bold mb-3">Safe Contacts</h3>
                      <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                        {safeContacts.map((contact) => (
                          <div
                            key={contact.id}
                            draggable
                            onDragStart={() => handleContactDragStart(contact.id)}
                            onDragEnd={() => setDraggedContactId(null)}
                            className="rounded-xl border border-slate-600 bg-slate-900/70 p-3 cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{contact.name}</p>
                                <p className="text-xs text-slate-400 truncate">
                                  {contact.contact_type === 'ring_ring_friend' ? (contact.sip_username || 'Ring Ring Friend') : (contact.phone_number || contact.phone || 'No number')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <select
                                  value={contact.quick_dial_slot ?? ''}
                                  onChange={(e) => {
                                    const slot = e.target.value ? parseInt(e.target.value) : null;
                                    if (slot === null) {
                                      void clearSlot(contact.id);
                                    } else {
                                      requestSlotAssignment(contact.id, slot);
                                    }
                                  }}
                                  className="bg-slate-700 border border-slate-500 rounded px-2 py-1 text-xs"
                                  disabled={contactLoading}
                                >
                                  <option value="">No key</option>
                                  {Array.from({ length: 9 }, (_, i) => i + 1).map((slot) => (
                                    <option key={slot} value={slot}>Key {slot}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                        {safeContacts.length === 0 && (
                          <p className="text-sm text-slate-400">No contacts yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-2 rounded-2xl bg-[#0b1220] border border-slate-700 p-4">
                      <div className="grid grid-cols-3 gap-3">
                        {quickDialSlots.map(({ slot, contact }) => (
                          <div
                            key={slot}
                            onDragOver={(e) => {
                              e.preventDefault();
                              handleSlotDragOver(slot);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleSlotDrop(slot);
                            }}
                            onDragLeave={() => setDragOverSlot((current) => (current === slot ? null : current))}
                            className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center px-2 text-center transition ${
                              dragOverSlot === slot ? 'border-[#C4531A] bg-[#C4531A]/10' : 'border-slate-600'
                            }`}
                          >
                            <div className="text-2xl font-black text-slate-300">{slot}</div>
                            {contact ? (
                              <>
                                <p className="text-xs font-bold mt-1 truncate w-full">{contact.name}</p>
                                <p className="text-[10px] text-slate-400 truncate w-full">{contact.contact_type === 'ring_ring_friend' ? 'Ring Ring Friend' : (contact.phone_number || contact.phone)}</p>
                              </>
                            ) : (
                              <p className="text-[10px] text-slate-500 mt-1">Unassigned</p>
                            )}
                          </div>
                        ))}
                        <div className="aspect-square rounded-2xl border border-slate-700 text-slate-500 flex items-center justify-center text-2xl font-black">*</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                    <h2 className="text-lg font-black text-stone-900 mb-4">Add Contact</h2>
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setContactType('ring_ring_friend')}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition ${
                          contactType === 'ring_ring_friend'
                            ? 'bg-[#C4531A] text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        👥 Ring Ring Friend (Free)
                      </button>
                      <button
                        onClick={() => setContactType('phone_number')}
                        disabled={profile?.plan === 'free'}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition ${
                          contactType === 'phone_number' && profile?.plan !== 'free'
                            ? 'bg-blue-600 text-white'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        📞 Phone Number {profile?.plan === 'free' && '(Paid Plan)'}
                      </button>
                    </div>

                  {/* Contact Form */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      className="px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                      placeholder="Name"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                    />
                    
                    {contactType === 'ring_ring_friend' ? (
                      <select
                        value={selectedFriendDevice}
                        onChange={(e) => setSelectedFriendDevice(e.target.value)}
                        className="px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                      >
                        <option value="">Select friend device</option>
                        {friendDevices.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name} ({device.friend_email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                        placeholder="Phone number"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        disabled={profile?.plan === 'free'}
                      />
                    )}
                    
                    <select
                      value={newContactSlot}
                      onChange={(e) => setNewContactSlot(e.target.value)}
                      className="px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                    >
                      <option value="">No quick dial</option>
                      {quickDialSlots.map(({ slot, contact }) => (
                        <option key={slot} value={slot}>
                          Key {slot}{contact ? ' (taken)' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={addContact}
                      disabled={
                        contactLoading ||
                        !newContactName.trim() ||
                        (contactType === 'ring_ring_friend' ? !selectedFriendDevice : !newContactPhone.trim())
                      }
                      className="px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50"
                    >
                      {contactLoading ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  
                  {/* Helper Text */}
                  {contactType === 'ring_ring_friend' && friendDevices.length === 0 && (
                    <p className="text-sm text-amber-700 mt-3 p-3 bg-amber-50 rounded-xl">
                      💡 No friends yet. Go to Friends tab to connect with another family.
                    </p>
                  )}
                </div>

                {/* Contact List */}
                <div className="bg-white rounded-3xl border-2 border-stone-100 overflow-hidden">
                  <div className="p-6 border-b border-stone-100">
                    <h2 className="text-lg font-black text-stone-900">All Contacts ({selectedContacts.length})</h2>
                  </div>
                  {selectedContacts.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-5xl mb-4">👥</div>
                      <p className="text-stone-500 text-lg font-medium">No contacts yet</p>
                      <p className="text-stone-400 text-sm mt-1">Add your first contact above</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {selectedContacts.map((contact) => (
                        <div key={contact.id} className="p-6 flex items-center justify-between hover:bg-stone-50">
                          <div className="flex items-center gap-4">
                            {contact.quick_dial_slot !== null && (
                              <span className="w-8 h-8 rounded-full bg-[#C4531A] text-white font-black text-sm flex items-center justify-center">
                                {contact.quick_dial_slot}
                              </span>
                            )}
                            <div>
                              <p className="font-black text-stone-900">{contact.name}</p>
                              <p className="text-sm text-stone-500 font-mono">{contact.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={contact.quick_dial_slot ?? ''}
                              onChange={(e) => {
                                const slot = e.target.value ? parseInt(e.target.value) : null;
                                if (slot === null) {
                                  void clearSlot(contact.id);
                                } else {
                                  requestSlotAssignment(contact.id, slot);
                                }
                              }}
                              className="px-3 py-2 rounded-lg border-2 border-stone-200 text-sm font-medium focus:border-[#C4531A] outline-none"
                            >
                              <option value="">No slot</option>
                              {Array.from({ length: 9 }, (_, i) => i + 1).map((s) => (
                                <option key={s} value={s}>Key {s}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => deleteContact(contact.id)}
                              className="px-4 py-2 text-red-600 hover:bg-red-50 font-bold rounded-xl transition text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {slotSwapModal && (
                  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-stone-200">
                      <h3 className="text-lg font-black text-stone-900">Swap quick dial assignment?</h3>
                      <p className="text-sm text-stone-600 mt-2">
                        Key {slotSwapModal.slot} is currently assigned to <span className="font-bold">{slotSwapModal.existingContact.name}</span>.
                        Replace it with your selected contact?
                      </p>
                      <div className="flex justify-end gap-2 mt-5">
                        <button
                          onClick={() => setSlotSwapModal(null)}
                          className="px-4 py-2 rounded-lg bg-stone-100 text-stone-700 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            const payload = slotSwapModal;
                            setSlotSwapModal(null);
                            await applySlotAssignment(payload.contactId, payload.slot, payload.existingContact.id);
                          }}
                          className="px-4 py-2 rounded-lg bg-[#C4531A] text-white font-semibold"
                        >
                          Swap & Assign
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </>
            ) : (
              <div className="bg-white rounded-3xl p-16 border-2 border-stone-100 text-center">
                <div className="text-6xl mb-4">📞</div>
                <p className="text-xl font-black text-stone-900 mb-2">No device selected</p>
                <p className="text-stone-500">Go to Devices tab to add or select a device first</p>
              </div>
            )}

          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <FriendsTab user={user} />
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

        {/* QR Code Provisioning Modal */}
        {showProvisionModal && provisionDeviceId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowProvisionModal(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-stone-900">Set Up Your Device</h2>
                <button
                  onClick={() => setShowProvisionModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* QR Code */}
                <div className="bg-stone-50 rounded-2xl p-6 text-center">
                  <p className="text-sm font-bold text-stone-600 mb-4">Scan with your device</p>
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <QRCodeSVG
                      value={`https://voip-dashboard-sigma.vercel.app/api/provision/auto/${provisionDeviceId}`}
                      size={200}
                      level="M"
                    />
                  </div>
                </div>

                {/* Manual URL */}
                <div>
                  <p className="text-sm font-bold text-stone-700 mb-2">Or enter this URL in your device:</p>
                  <div className="bg-stone-50 rounded-xl p-4 border-2 border-stone-200">
                    <code className="text-sm text-stone-700 break-all">
                      https://voip-dashboard-sigma.vercel.app/api/provision/auto/{provisionDeviceId}
                    </code>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://voip-dashboard-sigma.vercel.app/api/provision/auto/${provisionDeviceId}`);
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-bold"
                  >
                    📋 Copy URL
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <p className="text-sm font-bold text-blue-900 mb-2">📱 Setup Instructions:</p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to your device&apos;s web interface</li>
                    <li>Find &quot;Provisioning&quot; or &quot;Auto Provision&quot; settings</li>
                    <li>Enter the URL above or scan the QR code</li>
                    <li>Save and reboot your device</li>
                    <li>Your device will auto-configure!</li>
                  </ol>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowProvisionModal(false)}
                  className="w-full px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition"
                >
                  Done
                </button>
              </div>
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
