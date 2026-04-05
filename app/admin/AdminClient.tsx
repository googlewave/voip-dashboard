'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ADAPTER_OPTIONS, getAdapterLabel, getDefaultAdapterType, getProvisioningQueryType } from '@/lib/voip/adapters';
import type { SupportedAdapterType } from '@/lib/voip/adapters';

type Device = {
  id: string;
  userId: string;
  name: string;
  sipUsername: string | null;
  adapterType: string | null;
  adapterIp: string | null;
  isOnline: boolean;
};

type Contact = {
  id: string;
  userId: string;
  deviceId: string | null;
  name: string;
  phoneNumber: string;
  quickDialSlot: number | null;
};

type User = {
  id: string;
  email: string;
  plan: string;
  twilioNumber: string | null;
  areaCode: string | null;
};

export default function AdminClient({
  users: initialUsers,
  devices: initialDevices,
  contacts: initialContacts,
}: {
  users: User[];
  devices: Device[];
  contacts: Contact[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [results, setResults] = useState<{ [key: string]: { username: string; password: string } }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddDevice, setShowAddDevice] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState({ name: '', adapterType: getDefaultAdapterType(), macAddress: '' });
  const [addingDevice, setAddingDevice] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<{ [deviceId: string]: { name: string; phone: string; slot: string } }>({});

  // Add User Modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', plan: 'free' });
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState('');

  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/landing');
  };

  const cleanupSip = async () => {
    if (!confirm('Delete all orphaned SIP users from Twilio? This cannot be undone.')) return;
    setLoading((prev) => ({ ...prev, cleanup_sip: true }));
    try {
      const res = await fetch('/api/admin/sip/cleanup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCleanupResult(`✅ Deleted ${data.deleted} orphaned SIP user${data.deleted !== 1 ? 's' : ''} (${data.kept} kept)`);
      } else {
        setCleanupResult(`❌ ${data.error}`);
      }
    } catch (err: any) {
      setCleanupResult(`❌ ${err.message}`);
    }
    setLoading((prev) => ({ ...prev, cleanup_sip: false }));
    setTimeout(() => setCleanupResult(null), 5000);
  };

  const addUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim()) return;
    setAddingUser(true);
    setAddUserError('');
    setAddUserSuccess('');
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUsers((prev) => [data.user, ...prev]);
        setAddUserSuccess(`✅ User ${data.user.email} created successfully!`);
        setNewUser({ email: '', password: '', plan: 'free' });
        setTimeout(() => {
          setShowAddUser(false);
          setAddUserSuccess('');
        }, 2000);
      } else {
        setAddUserError(data.error ?? 'Failed to create user');
      }
    } catch (err: any) {
      setAddUserError(err.message);
    }
    setAddingUser(false);
  };

  const copyProvisionUrl = (deviceId: string, adapterType: string | null) => {
    const typeParam = getProvisioningQueryType(adapterType);
    const url = `${window.location.origin}/api/provision/auto/${deviceId}?type=${typeParam}`;
    navigator.clipboard.writeText(url);
    setCopiedId(deviceId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createSipUser = async (deviceId: string, userId: string) => {
    setLoading((prev) => ({ ...prev, [deviceId]: true }));
    setErrors((prev) => ({ ...prev, [deviceId]: '' }));
    try {
      const res = await fetch('/api/sip/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, userId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResults((prev) => ({ ...prev, [deviceId]: { username: data.sipUsername, password: data.sipPassword } }));
        setDevices((prev) => prev.map((d) => d.id === deviceId ? { ...d, sipUsername: data.sipUsername } : d));
      } else {
        setErrors((prev) => ({ ...prev, [deviceId]: data.error ?? 'Failed' }));
      }
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [deviceId]: err.message }));
    }
    setLoading((prev) => ({ ...prev, [deviceId]: false }));
  };

  const resetSip = async (deviceId: string, userId: string) => {
    if (!confirm('Reset SIP credentials? Old credentials will stop working.')) return;
    setLoading((prev) => ({ ...prev, [`reset_${deviceId}`]: true }));
    try {
      await fetch('/api/sip/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      setDevices((prev) => prev.map((d) => d.id === deviceId ? { ...d, sipUsername: null } : d));
      await createSipUser(deviceId, userId);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [deviceId]: err.message }));
    }
    setLoading((prev) => ({ ...prev, [`reset_${deviceId}`]: false }));
  };

  const addDevice = async (userId: string) => {
    if (!newDevice.name.trim() || !newDevice.macAddress.trim()) return;
    setAddingDevice(true);
    try {
      const res = await fetch('/api/devices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newDevice }),
      });
      const data = await res.json();
      if (res.ok && data.device) {
        setDevices((prev) => [...prev, data.device]);
        setNewDevice({ name: '', adapterType: getDefaultAdapterType(), macAddress: '' });
        setShowAddDevice(null);
      } else {
        alert(data.error ?? 'Failed');
      }
    } catch (err: any) {
      alert(err.message);
    }
    setAddingDevice(false);
  };

  const provisionNumber = async (userId: string, areaCode: string, e911?: object) => {
    setLoading((prev) => ({ ...prev, [`number_${userId}`]: true }));
    setErrors((prev) => ({ ...prev, [`number_${userId}`]: '' }));
    try {
      const res = await fetch('/api/admin/provision-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, areaCode, e911 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [`number_${userId}`]: data.error ?? 'Failed' }));
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [`number_${userId}`]: err.message }));
    }
    setLoading((prev) => ({ ...prev, [`number_${userId}`]: false }));
  };

  const addContact = async (deviceId: string, userId: string) => {
    const c = newContact[deviceId];
    if (!c?.name?.trim() || !c?.phone?.trim()) return;
    setLoading((prev) => ({ ...prev, [`contact_${deviceId}`]: true }));
    try {
      const res = await fetch('/api/admin/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          deviceId,
          name: c.name.trim(),
          phoneNumber: c.phone.trim(),
          quickDialSlot: c.slot ? parseInt(c.slot) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.contact) {
        setContacts((prev) => [...prev, data.contact]);
        setNewContact((prev) => ({ ...prev, [deviceId]: { name: '', phone: '', slot: '' } }));
      } else {
        alert(data.error ?? 'Failed');
      }
    } catch (err: any) {
      alert(err.message);
    }
    setLoading((prev) => ({ ...prev, [`contact_${deviceId}`]: false }));
  };

  const removeContact = async (contactId: string) => {
    await fetch('/api/admin/contacts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId }),
    });
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  const updateSlot = async (contactId: string, deviceId: string, slot: number | null) => {
    await fetch('/api/admin/contacts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, quickDialSlot: slot, deviceId }),
    });
    setContacts((prev) => prev.map((c) => {
      if (c.deviceId === deviceId && c.quickDialSlot === slot && c.id !== contactId) return { ...c, quickDialSlot: null };
      if (c.id === contactId) return { ...c, quickDialSlot: slot };
      return c;
    }));
  };

  const deleteDevice = async (deviceId: string) => {
    if (!confirm('Delete this device and all its contacts? This cannot be undone.')) return;
    setLoading((prev) => ({ ...prev, [`delete_${deviceId}`]: true }));
    await fetch('/api/admin/devices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    setContacts((prev) => prev.filter((c) => c.deviceId !== deviceId));
    setLoading((prev) => ({ ...prev, [`delete_${deviceId}`]: false }));
  };

  const toggleDevice = async (deviceId: string, currentStatus: boolean) => {
    setLoading((prev) => ({ ...prev, [`toggle_${deviceId}`]: true }));
    await fetch('/api/admin/devices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, isOnline: !currentStatus }),
    });
    setDevices((prev) =>
      prev.map((d) => d.id === deviceId ? { ...d, isOnline: !currentStatus } : d)
    );
    setLoading((prev) => ({ ...prev, [`toggle_${deviceId}`]: false }));
  };

  const getVal = (id: string) =>
    (document.getElementById(id) as HTMLInputElement)?.value?.trim() ?? '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin — Users & Devices</h1>
          <p className="text-slate-400 text-sm mt-1">
            {users.length} user(s) • {devices.length} device(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowAddUser(true); setAddUserError(''); setAddUserSuccess(''); }}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg transition text-sm font-medium"
          >
            + Add User
          </button>
          <button
            onClick={cleanupSip}
            disabled={loading['cleanup_sip']}
            className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white rounded-lg transition text-sm font-medium"
            title="Delete orphaned SIP users from Twilio"
          >
            {loading['cleanup_sip'] ? 'Cleaning...' : '🧹 Cleanup SIP'}
          </button>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Cleanup SIP Result Toast */}
      {cleanupResult && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-sm text-white">
          {cleanupResult}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Add New User</h2>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-slate-400 hover:text-white transition text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block font-medium">Email address</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block font-medium">Password</label>
                <input
                  type="text"
                  placeholder="Temporary password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
                />
                <p className="text-xs text-slate-500 mt-1">User can change this after first login</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block font-medium">Plan</label>
                <select
                  value={newUser.plan}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, plan: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              {addUserError && (
                <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-3 py-2 text-sm">
                  ❌ {addUserError}
                </div>
              )}
              {addUserSuccess && (
                <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg px-3 py-2 text-sm">
                  {addUserSuccess}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={addUser}
                  disabled={addingUser || !newUser.email.trim() || !newUser.password.trim()}
                  className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition"
                >
                  {addingUser ? 'Creating...' : 'Create User'}
                </button>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {users.map((u) => {
          const userDevices = devices.filter((d) => d.userId === u.id);
          const isExpanded = expandedUser === u.id;

          return (
            <div key={u.id} className="bg-slate-900 rounded-xl border border-slate-800">

              {/* User Header */}
              <div className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    {u.email}
                    {u.plan === 'pro' ? (
                      <span className="text-xs bg-yellow-500 text-yellow-950 font-bold px-2 py-0.5 rounded-full">⭐ PRO</span>
                    ) : (
                      <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Free</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ID: {u.id}
                    {u.twilioNumber && (
                      <span className="ml-3 text-green-400 font-mono">📞 {u.twilioNumber}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                    {userDevices.length} device(s)
                  </span>
                  <button
                    onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-white transition"
                  >
                    {isExpanded ? '▲ Collapse' : '▼ Manage'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-800 p-4 space-y-6">

                  {/* Phone Number Provisioning */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">📞 Phone Number</h3>
                    {u.twilioNumber ? (
                      <div className="flex items-center gap-3 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                        <span className="text-green-300 font-mono text-sm">{u.twilioNumber}</span>
                        <span className="text-xs text-green-500">Active</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2 items-end flex-wrap">
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Area Code</label>
                            <input
                              type="text"
                              maxLength={3}
                              placeholder="e.g. 302"
                              defaultValue={u.areaCode ?? ''}
                              id={`area_${u.id}`}
                              className="w-24 bg-slate-800 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Customer Name</label>
                            <input
                              id={`e911_name_${u.id}`}
                              type="text"
                              placeholder="John Smith"
                              className="bg-slate-800 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-36"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Street</label>
                            <input
                              id={`e911_street_${u.id}`}
                              type="text"
                              placeholder="123 Main St"
                              className="bg-slate-800 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-40"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">City</label>
                            <input
                              id={`e911_city_${u.id}`}
                              type="text"
                              placeholder="Philadelphia"
                              className="bg-slate-800 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-32"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">State</label>
                            <input
                              id={`e911_region_${u.id}`}
                              type="text"
                              placeholder="PA"
                              maxLength={2}
                              className="bg-slate-800 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-16"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">ZIP</label>
                            <input
                              id={`e911_zip_${u.id}`}
                              type="text"
                              placeholder="19103"
                              maxLength={5}
                              className="bg-slate-800 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-24"
                            />
                          </div>
                          <button
                            onClick={() => {
                              provisionNumber(u.id, getVal(`area_${u.id}`), {
                                customerName: getVal(`e911_name_${u.id}`),
                                street: getVal(`e911_street_${u.id}`),
                                city: getVal(`e911_city_${u.id}`),
                                region: getVal(`e911_region_${u.id}`),
                                postalCode: getVal(`e911_zip_${u.id}`),
                              });
                            }}
                            disabled={loading[`number_${u.id}`]}
                            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded text-white font-medium transition self-end"
                          >
                            {loading[`number_${u.id}`] ? 'Provisioning...' : '+ Provision Number'}
                          </button>
                        </div>
                        <p className="text-xs text-amber-400">
                          🚨 E911 address required — without it Twilio charges $75 per 911 call
                        </p>
                      </div>
                    )}
                    {errors[`number_${u.id}`] && (
                      <p className="mt-2 text-xs text-red-400">❌ {errors[`number_${u.id}`]}</p>
                    )}
                  </div>

                  {/* Devices */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-300">📱 Devices</h3>
                      <button
                        onClick={() => setShowAddDevice(showAddDevice === u.id ? null : u.id)}
                        className="text-xs bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded text-white font-medium transition"
                      >
                        + Add Device
                      </button>
                    </div>

                    {showAddDevice === u.id && (
                      <div className="mb-3 p-3 bg-slate-800 rounded-lg border border-slate-700 flex gap-3 items-end flex-wrap">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Office Phone"
                            value={newDevice.name}
                            onChange={(e) => setNewDevice((prev) => ({ ...prev, name: e.target.value }))}
                            className="bg-slate-700 text-white text-sm rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Type</label>
                          <select
                            value={newDevice.adapterType}
                            onChange={(e) => setNewDevice((prev) => ({ ...prev, adapterType: e.target.value as SupportedAdapterType }))}
                            className="bg-slate-700 text-white text-sm rounded px-3 py-2 border border-slate-600 focus:outline-none"
                          >
                            {ADAPTER_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">MAC Address *</label>
                          <input
                            type="text"
                            placeholder="e.g. C0:74:AD:12:34:56"
                            value={newDevice.macAddress}
                            onChange={(e) => {
                              let val = e.target.value.toUpperCase().replace(/[^A-F0-9:]/g, '');
                              // Auto-insert colons
                              const hex = val.replace(/:/g, '');
                              if (hex.length > 2 && !val.includes(':')) {
                                val = hex.match(/.{1,2}/g)?.join(':') || val;
                              }
                              if (val.length <= 17) {
                                setNewDevice((prev) => ({ ...prev, macAddress: val }));
                              }
                            }}
                            className="bg-slate-700 text-white text-sm rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                        <button
                          onClick={() => addDevice(u.id)}
                          disabled={addingDevice || !newDevice.name.trim() || !newDevice.macAddress.trim()}
                          className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded text-white font-medium transition"
                        >
                          {addingDevice ? 'Adding...' : 'Add'}
                        </button>
                        <button
                          onClick={() => setShowAddDevice(null)}
                          className="text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-slate-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {userDevices.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No devices yet</p>
                    ) : (
                      <div className="space-y-3">
                        {userDevices.map((d) => {
                          const deviceContacts = contacts.filter((c) => c.deviceId === d.id);
                          const isDeviceExpanded = expandedDevice === d.id;
                          const quickSlots = Array.from({ length: 9 }, (_, i) => ({
                            slot: i + 1,
                            contact: deviceContacts.find((c) => c.quickDialSlot === i + 1) ?? null,
                          }));
                          const nc = newContact[d.id] ?? { name: '', phone: '', slot: '' };

                          return (
                            <div key={d.id} className="bg-slate-800/60 rounded-lg border border-slate-700">

                              {/* Device Row */}
                              <div className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${d.isOnline ? 'bg-green-400' : 'bg-slate-500'}`} />
                                  <div>
                                    <div className="text-sm font-medium">
                                      {d.name}{' '}
                                      <span className="text-slate-400 text-xs">({getAdapterLabel(d.adapterType)})</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                      IP: {d.adapterIp ?? 'none'} • SIP: {d.sipUsername ?? 'not provisioned'} •{' '}
                                      {deviceContacts.length} contact(s)
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  <button
                                    onClick={() => setExpandedDevice(isDeviceExpanded ? null : d.id)}
                                    className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-white transition"
                                  >
                                    {isDeviceExpanded ? '▲ Hide Dial' : '⚡ Quick Dial'}
                                  </button>
                                  {d.sipUsername && (
                                    <button
                                      onClick={() => copyProvisionUrl(d.id, d.adapterType)}
                                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                                    >
                                      {copiedId === d.id ? <span className="text-green-400">✅ Copied!</span> : '📋 Copy URL'}
                                    </button>
                                  )}
                                  {d.sipUsername ? (
                                    <>
                                      <span className="text-xs text-green-400 font-medium">✅ SIP Active</span>
                                      <button
                                        onClick={() => resetSip(d.id, u.id)}
                                        disabled={loading[`reset_${d.id}`]}
                                        className="text-xs bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 px-3 py-1.5 rounded text-white font-medium transition"
                                      >
                                        {loading[`reset_${d.id}`] ? 'Resetting...' : '🔄 Reset SIP'}
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => createSipUser(d.id, u.id)}
                                      disabled={loading[d.id]}
                                      className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded text-white font-medium transition"
                                    >
                                      {loading[d.id] ? 'Creating...' : 'Create SIP'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => toggleDevice(d.id, d.isOnline)}
                                    disabled={loading[`toggle_${d.id}`]}
                                    className={`text-xs disabled:opacity-50 px-3 py-1.5 rounded text-white font-medium transition ${
                                      d.isOnline
                                        ? 'bg-slate-600 hover:bg-slate-500'
                                        : 'bg-green-700 hover:bg-green-600'
                                    }`}
                                  >
                                    {loading[`toggle_${d.id}`] ? '...' : d.isOnline ? '⏸ Disable' : '▶ Enable'}
                                  </button>
                                  <button
                                    onClick={() => deleteDevice(d.id)}
                                    disabled={loading[`delete_${d.id}`]}
                                    className="text-xs bg-red-800 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 rounded text-white font-medium transition"
                                  >
                                    {loading[`delete_${d.id}`] ? '...' : '🗑 Delete'}
                                  </button>
                                </div>
                              </div>

                              {/* SIP result / error */}
                              {results[d.id] && (
                                <div className="mx-4 mb-3 p-3 bg-green-900/40 border border-green-700 rounded text-xs text-green-300">
                                  <div className="font-semibold mb-1">✅ SIP Credentials Created</div>
                                  <div>Username: <span className="font-mono">{results[d.id].username}</span></div>
                                  <div>Password: <span className="font-mono">{results[d.id].password}</span></div>
                                  <div className="text-green-500 mt-1">⚠️ Save these — password won't be shown again.</div>
                                </div>
                              )}
                              {errors[d.id] && (
                                <div className="mx-4 mb-3 p-3 bg-red-900/40 border border-red-700 rounded text-xs text-red-300">
                                  ❌ {errors[d.id]}
                                </div>
                              )}

                              {/* Quick Dial Panel */}
                              {isDeviceExpanded && (
                                <div className="border-t border-slate-700 p-4 space-y-4">

                                  {/* Slot Grid */}
                                  <div className="grid grid-cols-3 gap-2">
                                    {quickSlots.map(({ slot, contact }) => (
                                      <div
                                        key={slot}
                                        className={`rounded-lg p-3 border text-center min-h-[72px] flex flex-col justify-center ${
                                          contact ? 'bg-blue-900/30 border-blue-700' : 'bg-slate-700/30 border-slate-600 border-dashed'
                                        }`}
                                      >
                                        <div className="text-xs text-slate-400 mb-1">Slot {slot}</div>
                                        {contact ? (
                                          <>
                                            <p className="text-sm font-semibold truncate">{contact.name}</p>
                                            <p className="text-xs text-slate-400 font-mono truncate">{contact.phoneNumber}</p>
                                            <button
                                              onClick={() => updateSlot(contact.id, d.id, null)}
                                              className="mt-1 text-xs text-red-400 hover:text-red-300"
                                            >
                                              Clear
                                            </button>
                                          </>
                                        ) : (
                                          <p className="text-slate-600 text-xs">Empty</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Add Contact */}
                                  <div className="flex gap-2 flex-wrap">
                                    <input
                                      placeholder="Name"
                                      value={nc.name}
                                      onChange={(e) => setNewContact((prev) => ({ ...prev, [d.id]: { ...nc, name: e.target.value } }))}
                                      className="bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-36"
                                    />
                                    <input
                                      placeholder="Phone number"
                                      value={nc.phone}
                                      onChange={(e) => setNewContact((prev) => ({ ...prev, [d.id]: { ...nc, phone: e.target.value } }))}
                                      className="bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-40"
                                    />
                                    <select
                                      value={nc.slot}
                                      onChange={(e) => setNewContact((prev) => ({ ...prev, [d.id]: { ...nc, slot: e.target.value } }))}
                                      className="bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-2 focus:outline-none"
                                    >
                                      <option value="">No quick dial</option>
                                      {Array.from({ length: 9 }, (_, i) => i + 1).map((s) => (
                                        <option key={s} value={s}>
                                          Slot {s}{quickSlots[s - 1].contact ? ' (taken)' : ''}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => addContact(d.id, u.id)}
                                      disabled={loading[`contact_${d.id}`] || !nc.name?.trim() || !nc.phone?.trim()}
                                      className="text-sm bg-green-700 hover:bg-green-600 disabled:opacity-50 px-4 py-2 rounded text-white font-medium transition"
                                    >
                                      {loading[`contact_${d.id}`] ? 'Adding...' : '+ Add'}
                                    </button>
                                  </div>

                                  {/* Contact list */}
                                  {deviceContacts.length > 0 && (
                                    <div className="space-y-1">
                                      {deviceContacts.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2">
                                          <div className="flex items-center gap-2">
                                            {c.quickDialSlot !== null && (
                                              <span className="text-xs bg-blue-900 text-blue-300 font-bold px-1.5 py-0.5 rounded">
                                                ⚡{c.quickDialSlot}
                                              </span>
                                            )}
                                            <span className="text-sm font-medium">{c.name}</span>
                                            <span className="text-xs text-slate-400 font-mono">{c.phoneNumber}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <select
                                              value={c.quickDialSlot ?? ''}
                                              onChange={(e) => updateSlot(c.id, d.id, e.target.value ? parseInt(e.target.value) : null)}
                                              className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                            >
                                              <option value="">No slot</option>
                                              {Array.from({ length: 9 }, (_, i) => i + 1).map((s) => (
                                                <option key={s} value={s}>Slot {s}</option>
                                              ))}
                                            </select>
                                            <button
                                              onClick={() => removeContact(c.id)}
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
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
