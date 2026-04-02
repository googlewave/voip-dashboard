'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TrustedContactsManager from '@/components/TrustedContactsManager';

type User = {
  id: string;
  email: string;
  plan: string;
  twilioNumber: string | null;
  twilioNumberSid: string | null;
  areaCode: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

type Device = {
  id: string;
  userId: string;
  name: string;
  status: boolean;
  sipUsername: string | null;
  sipPassword: string | null;
  sipDomain: string | null;
  macAddress: string | null;
  adapterType: string | null;
  adapterIp: string | null;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  usageCapEnabled: boolean;
  usageCapMinutes: number | null;
  phoneNumber: string | null;
};

type Contact = {
  id: string;
  userId: string;
  deviceId: string | null;
  name: string;
  phone: string;
  quickDialSlot: number | null;
  contact_type?: string;
  sip_username?: string | null;
};

type Tab = 'users' | 'billing' | 'system';

export default function AdminDashboard({
  initialUsers,
  initialDevices,
  initialContacts,
  adminUser,
}: {
  initialUsers: User[];
  initialDevices: Device[];
  initialContacts: Contact[];
  adminUser: { id: string; email: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editDeviceForm, setEditDeviceForm] = useState({ name: '', macAddress: '', adapterType: '' });

  // User Management
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', plan: 'free' });
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState('');

  // Manual Billing
  const [showManualBilling, setShowManualBilling] = useState(false);
  const [manualBillingUser, setManualBillingUser] = useState<string | null>(null);
  const [manualPlan, setManualPlan] = useState('free');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');

  // Phone Number Provisioning
  const [provisioningUser, setProvisioningUser] = useState<string | null>(null);
  const [e911Data, setE911Data] = useState({
    areaCode: '',
    customerName: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
  });

  // System
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  // Users & Devices (combined view)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [addDeviceUserId, setAddDeviceUserId] = useState<string | null>(null);
  const [addDeviceForm, setAddDeviceForm] = useState({ name: '', adapterType: 'grandstream', macAddress: '', phoneNumber: '' });

  const refreshData = async () => {
    const res = await fetch('/api/admin/data');
    const data = await res.json();
    setUsers(data.users);
    setDevices(data.devices);
    setContacts(data.contacts);
  };

  const addUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim()) return;
    setAddingUser(true);
    setAddUserError('');
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        setNewUser({ email: '', password: '', plan: 'free' });
        setShowAddUser(false);
        await refreshData();
      } else {
        setAddUserError(data.error || 'Failed to create user');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setAddUserError(message);
    }
    setAddingUser(false);
  };

  const updateUserPlan = async (userId: string, plan: string) => {
    setLoading({ ...loading, [`plan_${userId}`]: true });
    await fetch('/api/admin/update-user-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan }),
    });
    await refreshData();
    setLoading({ ...loading, [`plan_${userId}`]: false });
  };

  const applyManualBilling = async () => {
    if (!manualBillingUser) return;
    setLoading({ ...loading, manual_billing: true });
    await fetch('/api/admin/manual-billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: manualBillingUser,
        plan: manualPlan,
        amount: manualAmount ? parseFloat(manualAmount) : null,
        note: manualNote,
      }),
    });
    setShowManualBilling(false);
    setManualBillingUser(null);
    setManualPlan('free');
    setManualAmount('');
    setManualNote('');
    await refreshData();
    setLoading({ ...loading, manual_billing: false });
  };

  const provisionNumber = async () => {
    if (!provisioningUser || !e911Data.areaCode) return;
    setLoading({ ...loading, provision_number: true });
    try {
      const res = await fetch('/api/admin/provision-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: provisioningUser,
          areaCode: e911Data.areaCode,
          e911: {
            customerName: e911Data.customerName,
            street: e911Data.street,
            city: e911Data.city,
            region: e911Data.region,
            postalCode: e911Data.postalCode,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProvisioningUser(null);
        setE911Data({
          areaCode: '',
          customerName: '',
          street: '',
          city: '',
          region: '',
          postalCode: '',
        });
        await refreshData();
      } else {
        alert(data.error || 'Failed to provision number');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to provision number';
      alert(message);
    }
    setLoading({ ...loading, provision_number: false });
  };

  const createSipUser = async (deviceId: string) => {
    setLoading({ ...loading, [`sip_${deviceId}`]: true });
    await fetch('/api/sip/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
    await refreshData();
    setLoading({ ...loading, [`sip_${deviceId}`]: false });
  };

  const resetSip = async (deviceId: string) => {
    if (!confirm('Reset SIP credentials for this device?')) return;
    setLoading({ ...loading, [`sip_reset_${deviceId}`]: true });
    await fetch('/api/sip/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
    await refreshData();
    setLoading({ ...loading, [`sip_reset_${deviceId}`]: false });
  };


  const copyProvisionUrl = (deviceId: string, adapterType: string) => {
    const type = adapterType === 'grandstream' ? 'grandstream.cfg' : 'linksys.cfg';
    const url = `${window.location.origin}/api/provision/${deviceId}/${type}`;
    navigator.clipboard.writeText(url);
    setCopiedId(deviceId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleDevice = async (deviceId: string, currentStatus: boolean) => {
    await fetch('/api/admin/toggle-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, status: !currentStatus }),
    });
    await refreshData();
  };

  const deleteDevice = async (deviceId: string) => {
    if (!confirm('Delete this device and all its contacts?')) return;
    await fetch('/api/admin/delete-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
    await refreshData();
  };

  const cleanupSip = async () => {
    if (!confirm('Delete all orphaned SIP users from Twilio?')) return;
    setLoading({ ...loading, cleanup_sip: true });
    try {
      const res = await fetch('/api/admin/sip/cleanup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCleanupResult(`✅ Deleted ${data.deleted} orphaned SIP user${data.deleted !== 1 ? 's' : ''} (${data.kept} kept)`);
      } else {
        setCleanupResult(`❌ ${data.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cleanup failed';
      setCleanupResult(`❌ ${message}`);
    }
    setLoading({ ...loading, cleanup_sip: false });
    setTimeout(() => setCleanupResult(null), 5000);
  };

  // Device Management
  const openEditDevice = (device: Device) => {
    setEditingDevice(device);
    setEditDeviceForm({
      name: device.name,
      macAddress: device.macAddress || '',
      adapterType: device.adapterType || '',
    });
    setShowEditDeviceModal(true);
  };

  const saveDevice = async () => {
    if (!editingDevice) return;
    
    setLoading({ ...loading, [`edit_${editingDevice.id}`]: true });
    try {
      const res = await fetch(`/api/devices/${editingDevice.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDeviceForm),
      });
      const data = await res.json();
      if (res.ok && data.device) {
        setDevices((prev) => 
          prev.map((d) => d.id === editingDevice.id ? { ...d, ...data.device } : d)
        );
        setShowEditDeviceModal(false);
        setEditingDevice(null);
      } else {
        alert(data.error ?? 'Failed to update device');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update device';
      alert(message);
    }
    setLoading({ ...loading, [`edit_${editingDevice.id}`]: false });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/landing');
  };

  const addDeviceForUser = async () => {
    if (!addDeviceUserId || !addDeviceForm.name.trim()) return;
    setLoading((prev) => ({ ...prev, add_device_for_user: true }));
    try {
      const res = await fetch('/api/devices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: addDeviceUserId,
          name: addDeviceForm.name.trim(),
          adapterType: addDeviceForm.adapterType,
          macAddress: addDeviceForm.macAddress.trim() || undefined,
          phoneNumber: addDeviceForm.phoneNumber || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddDeviceModal(false);
        setAddDeviceUserId(null);
        setAddDeviceForm({ name: '', adapterType: 'grandstream', macAddress: '', phoneNumber: '' });
        await refreshData();
      } else {
        alert(data.error || 'Failed to add device');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add device');
    }
    setLoading((prev) => ({ ...prev, add_device_for_user: false }));
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Permanently delete ${email} and all their data? This cannot be undone.`)) return;
    setLoading((prev) => ({ ...prev, [`delete_user_${userId}`]: true }));
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setExpandedUserId(null);
        await refreshData();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
    setLoading((prev) => ({ ...prev, [`delete_user_${userId}`]: false }));
  };



  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      
      {/* Header */}
      <header className="bg-gradient-to-r from-[#C4531A] to-[#a84313] border-b border-[#a84313]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => router.push('/portal-select')} className="text-xl font-black text-white">
              ⚡ Admin Portal
            </button>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-orange-100">
              {(['users', 'billing', 'system'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`capitalize transition ${activeTab === tab ? 'text-white font-bold' : 'hover:text-white'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/20 text-white font-bold px-3 py-1.5 rounded-full">
              Admin
            </span>
            <button onClick={signOut} className="text-sm text-orange-100 hover:text-white transition">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-stone-900 mb-2">Admin Dashboard</h1>
          <p className="text-stone-500">{adminUser.email} • {users.length} users • {devices.length} devices</p>
        </div>

        {cleanupResult && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-white border-2 border-stone-200 text-sm font-medium">
            {cleanupResult}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-stone-900">Users &amp; Devices</h2>
                <p className="text-stone-500 text-sm">{users.length} users · {devices.length} devices</p>
              </div>
              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="px-5 py-2.5 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition text-sm"
              >
                {showAddUser ? '✕ Cancel' : '+ Add User'}
              </button>
            </div>

            {/* Add User Form */}
            {showAddUser && (
              <div className="bg-white rounded-2xl p-5 border-2 border-[#C4531A]">
                <h3 className="text-base font-black text-stone-900 mb-4">Create New User</h3>
                {addUserError && <div className="mb-3 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm">{addUserError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    className="px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-sm"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                  <input
                    type="password"
                    className="px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-sm"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                  <select
                    value={newUser.plan}
                    onChange={(e) => setNewUser({ ...newUser, plan: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-sm"
                  >
                    <option value="free">Free</option>
                    <option value="monthly">Monthly ($8.95)</option>
                    <option value="annual">Annual ($85.80)</option>
                  </select>
                  <button
                    onClick={addUser}
                    disabled={addingUser}
                    className="px-6 py-2.5 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50 text-sm"
                  >
                    {addingUser ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            )}

            {/* User List */}
            <div className="bg-white rounded-2xl border-2 border-stone-100 overflow-hidden divide-y divide-stone-100">
              {users.length === 0 && (
                <div className="p-12 text-center text-stone-400">No users yet</div>
              )}
              {users.map((user) => {
                const isExpanded = expandedUserId === user.id;
                const userDeviceList = devices.filter((d) => d.userId === user.id);
                const userContactList = contacts.filter((c) => c.userId === user.id);

                return (
                  <div key={user.id}>
                    {/* User Row Header — always visible */}
                    <button
                      onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition text-left group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-sm font-black text-stone-600 flex-shrink-0">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-stone-900 text-sm">{user.email}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              user.plan === 'free' ? 'bg-stone-100 text-stone-500' : 'bg-[#C4531A] text-white'
                            }`}>
                              {user.plan === 'free' ? 'Free' : user.plan === 'annual' ? 'Annual' : 'Monthly'}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {userDeviceList.length} device{userDeviceList.length !== 1 ? 's' : ''}
                            {user.twilioNumber && <span className="font-mono ml-2">{user.twilioNumber}</span>}
                          </p>
                        </div>
                      </div>
                      <span className="text-stone-400 text-xs ml-4 flex-shrink-0 group-hover:text-stone-600 transition">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </button>

                    {/* Expanded User Panel */}
                    {isExpanded && (
                      <div className="bg-stone-50 border-t border-stone-100 px-6 py-5 space-y-5">

                        {/* User details + actions row */}
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* User info */}
                          <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                            <div>
                              <span className="text-xs text-stone-400 uppercase tracking-wide">Email</span>
                              <p className="font-medium text-stone-800">{user.email}</p>
                            </div>
                            <div>
                              <span className="text-xs text-stone-400 uppercase tracking-wide">Plan</span>
                              <p className="font-medium text-stone-800 capitalize">{user.plan}</p>
                            </div>
                            <div>
                              <span className="text-xs text-stone-400 uppercase tracking-wide">Phone Number</span>
                              <p className="font-mono text-stone-800">{user.twilioNumber || <span className="text-stone-400 not-italic">Not provisioned</span>}</p>
                            </div>
                            <div>
                              <span className="text-xs text-stone-400 uppercase tracking-wide">Stripe ID</span>
                              <p className="font-mono text-stone-600 text-xs truncate">{user.stripeCustomerId || '—'}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={user.plan}
                              onChange={(e) => updateUserPlan(user.id, e.target.value)}
                              disabled={loading[`plan_${user.id}`]}
                              className="px-3 py-2 rounded-lg border-2 border-stone-200 bg-white text-sm font-medium focus:border-[#C4531A] outline-none"
                            >
                              <option value="free">Free</option>
                              <option value="monthly">Monthly</option>
                              <option value="annual">Annual</option>
                            </select>
                            {!user.twilioNumber && (
                              <button
                                onClick={() => {
                                  setProvisioningUser(user.id);
                                  setE911Data({ ...e911Data, areaCode: user.areaCode || '' });
                                }}
                                className="px-3 py-2 bg-blue-100 text-blue-800 font-bold rounded-lg hover:bg-blue-200 transition text-sm"
                              >
                                + Phone #
                              </button>
                            )}
                            <button
                              onClick={() => { setManualBillingUser(user.id); setShowManualBilling(true); }}
                              className="px-3 py-2 bg-amber-100 text-amber-800 font-bold rounded-lg hover:bg-amber-200 transition text-sm"
                            >
                              Manual Billing
                            </button>
                            <button
                              onClick={() => deleteUser(user.id, user.email)}
                              disabled={loading[`delete_user_${user.id}`]}
                              className="px-3 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition text-sm disabled:opacity-50"
                            >
                              {loading[`delete_user_${user.id}`] ? 'Deleting...' : 'Delete User'}
                            </button>
                          </div>
                        </div>

                        {/* Devices Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-black text-stone-900 text-sm">
                              Devices <span className="text-stone-400 font-normal">({userDeviceList.length})</span>
                            </h4>
                            <button
                              onClick={() => {
                                setAddDeviceUserId(user.id);
                                setShowAddDeviceModal(true);
                              }}
                              className="px-3 py-1.5 bg-stone-800 text-white font-bold rounded-lg hover:bg-stone-700 transition text-xs"
                            >
                              + Add Device
                            </button>
                          </div>

                          {userDeviceList.length === 0 ? (
                            <div className="py-6 text-center text-sm text-stone-400 bg-white rounded-xl border-2 border-dashed border-stone-200">
                              No devices yet — add one above
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {userDeviceList.map((device) => {
                                const deviceContacts = userContactList.filter((c) => c.deviceId === device.id);
                                const isDeviceExpanded = expandedDeviceId === device.id;
                                const adapterLabel = device.adapterType === 'grandstream' ? 'Grandstream HT801'
                                  : device.adapterType === 'linksys' ? 'Linksys SPA2102'
                                  : device.adapterType || 'Unknown';

                                return (
                                  <div key={device.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                                    {/* Device row */}
                                    <div className="flex items-center gap-3 px-4 py-3">
                                      {/* Status toggle */}
                                      <button
                                        onClick={() => toggleDevice(device.id, device.status)}
                                        title={device.status ? 'Online — click to disable' : 'Offline — click to enable'}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition ${
                                          device.status ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                                        }`}
                                      >
                                        {device.status ? '✓' : '○'}
                                      </button>

                                      {/* Device info */}
                                      <button
                                        onClick={() => setExpandedDeviceId(isDeviceExpanded ? null : device.id)}
                                        className="flex-1 text-left min-w-0"
                                      >
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-bold text-stone-900 text-sm">{device.name}</span>
                                          {device.adapterType && (
                                            <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full">{adapterLabel}</span>
                                          )}
                                          {device.sipUsername
                                            ? <span className="text-xs text-green-600 font-semibold">SIP ✓</span>
                                            : <span className="text-xs text-amber-600 font-semibold">No SIP</span>
                                          }
                                        </div>
                                        <p className="text-xs text-stone-400 mt-0.5 truncate">
                                          {device.phoneNumber
                                            ? <span className="font-mono text-blue-600 font-semibold">{device.phoneNumber}</span>
                                            : <span className="text-amber-500">No line</span>
                                          }
                                          {' · '}{device.sipUsername || 'No SIP creds'}
                                          {device.macAddress && ` · ${device.macAddress}`}
                                          {deviceContacts.length > 0 && ` · ${deviceContacts.length} contact${deviceContacts.length !== 1 ? 's' : ''}`}
                                        </p>
                                      </button>

                                      {/* Device actions */}
                                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                                        {device.sipUsername ? (
                                          <>
                                            <button
                                              onClick={() => copyProvisionUrl(device.id, device.adapterType || 'linksys')}
                                              className="px-2.5 py-1.5 bg-blue-100 text-blue-800 font-bold rounded-lg hover:bg-blue-200 transition text-xs"
                                            >
                                              {copiedId === device.id ? '✓ Copied' : 'Copy URL'}
                                            </button>
                                            <button
                                              onClick={() => resetSip(device.id)}
                                              disabled={loading[`sip_reset_${device.id}`]}
                                              className="px-2.5 py-1.5 bg-amber-100 text-amber-800 font-bold rounded-lg hover:bg-amber-200 transition text-xs disabled:opacity-50"
                                            >
                                              Reset SIP
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            onClick={() => createSipUser(device.id)}
                                            disabled={loading[`sip_${device.id}`]}
                                            className="px-2.5 py-1.5 bg-green-100 text-green-800 font-bold rounded-lg hover:bg-green-200 transition text-xs disabled:opacity-50"
                                          >
                                            {loading[`sip_${device.id}`] ? 'Creating...' : 'Create SIP'}
                                          </button>
                                        )}
                                        <button
                                          onClick={() => openEditDevice(device)}
                                          className="px-2.5 py-1.5 bg-purple-100 text-purple-800 font-bold rounded-lg hover:bg-purple-200 transition text-xs"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => deleteDevice(device.id)}
                                          className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 font-bold rounded-lg transition text-xs"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>

                                    {/* Expanded device details */}
                                    {isDeviceExpanded && (
                                      <div className="border-t border-stone-100 px-4 py-4 bg-stone-50 space-y-4">
                                        {/* SIP Credentials */}
                                        <div>
                                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">SIP Credentials</p>
                                          {device.sipUsername ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                              {[
                                                { label: 'Username', value: device.sipUsername },
                                                { label: 'Password', value: device.sipPassword || '—' },
                                                { label: 'Domain', value: device.sipDomain || '—' },
                                              ].map(({ label, value }) => (
                                                <div key={label}>
                                                  <p className="text-xs text-stone-400 mb-1">{label}</p>
                                                  <p className="text-xs font-mono text-stone-800 bg-white px-3 py-2 rounded-lg border border-stone-200 truncate">{value}</p>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-stone-400 italic">No SIP credentials — click &quot;Create SIP&quot; to generate</p>
                                          )}
                                        </div>

                                        {/* Device Info */}
                                        <div>
                                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Device Info</p>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {[
                                              { label: 'Device ID', value: device.id },
                                              { label: 'Type', value: adapterLabel },
                                              { label: 'MAC Address', value: device.macAddress || '—' },
                                              { label: 'IP Address', value: device.adapterIp || '—' },
                                            ].map(({ label, value }) => (
                                              <div key={label}>
                                                <p className="text-xs text-stone-400 mb-1">{label}</p>
                                                <p className="text-xs font-mono text-stone-800 bg-white px-3 py-2 rounded-lg border border-stone-200 truncate">{value}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Trusted Contacts Manager */}
                                        <div className="bg-white rounded-2xl border border-stone-200 p-4">
                                          <TrustedContactsManager
                                            deviceId={device.id}
                                            userId={user.id}
                                            deviceName={device.name}
                                          />
                                        </div>
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
        )}

        {/* Manual Billing Modal */}
        {showManualBilling && manualBillingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border-2 border-stone-100">
              <h3 className="text-2xl font-black text-stone-900 mb-6">Manual Billing</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">Plan</label>
                  <select
                    value={manualPlan}
                    onChange={(e) => setManualPlan(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                  >
                    <option value="free">Free (F&F)</option>
                    <option value="monthly">Monthly ($8.95)</option>
                    <option value="annual">Annual ($85.80)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">Manual Charge (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                  />
                  <p className="text-xs text-stone-500 mt-1">Leave empty to bypass Stripe entirely</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">Note</label>
                  <textarea
                    placeholder="e.g., Friends & Family discount, Manual payment received"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={applyManualBilling}
                    disabled={loading.manual_billing}
                    className="flex-1 px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50"
                  >
                    {loading.manual_billing ? 'Applying...' : 'Apply'}
                  </button>
                  <button
                    onClick={() => { setShowManualBilling(false); setManualBillingUser(null); }}
                    className="px-6 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phone Number Provisioning Modal */}
        {provisioningUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full border-2 border-stone-100">
              <h3 className="text-2xl font-black text-stone-900 mb-2">📞 Provision Phone Number</h3>
              <p className="text-sm text-stone-500 mb-6">E911 address is required to avoid $75 per 911 call charge from Twilio</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-900 mb-2">Area Code *</label>
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="302"
                      value={e911Data.areaCode}
                      onChange={(e) => setE911Data({ ...e911Data, areaCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-900 mb-2">Customer Name *</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      value={e911Data.customerName}
                      onChange={(e) => setE911Data({ ...e911Data, customerName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">Street Address *</label>
                  <input
                    type="text"
                    placeholder="123 Main St"
                    value={e911Data.street}
                    onChange={(e) => setE911Data({ ...e911Data, street: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-900 mb-2">City *</label>
                    <input
                      type="text"
                      placeholder="Philadelphia"
                      value={e911Data.city}
                      onChange={(e) => setE911Data({ ...e911Data, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-900 mb-2">State *</label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="PA"
                      value={e911Data.region}
                      onChange={(e) => setE911Data({ ...e911Data, region: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-900 mb-2">ZIP Code *</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="19103"
                      value={e911Data.postalCode}
                      onChange={(e) => setE911Data({ ...e911Data, postalCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Important:</strong> This E911 address will be used for emergency services. 
                    Make sure it&apos;s accurate and matches the physical location where the phone will be used.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={provisionNumber}
                    disabled={loading.provision_number || !e911Data.areaCode || !e911Data.customerName || !e911Data.street || !e911Data.city || !e911Data.region || !e911Data.postalCode}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading.provision_number ? 'Provisioning...' : 'Provision Number'}
                  </button>
                  <button
                    onClick={() => {
                      setProvisioningUser(null);
                      setE911Data({
                        areaCode: '',
                        customerName: '',
                        street: '',
                        city: '',
                        region: '',
                        postalCode: '',
                      });
                    }}
                    className="px-6 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Device Modal */}
        {showAddDeviceModal && addDeviceUserId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border-2 border-stone-100">
              <h3 className="text-xl font-black text-stone-900 mb-2">Add Device</h3>
              <p className="text-sm text-stone-500 mb-6">
                Adding device for <span className="font-bold">{users.find(u => u.id === addDeviceUserId)?.email}</span>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">Device Name *</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                    placeholder="e.g. Kitchen Phone"
                    value={addDeviceForm.name}
                    onChange={(e) => setAddDeviceForm({ ...addDeviceForm, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addDeviceForUser()}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">Adapter Type</label>
                  <select
                    value={addDeviceForm.adapterType}
                    onChange={(e) => setAddDeviceForm({ ...addDeviceForm, adapterType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
                  >
                    <option value="grandstream">Grandstream HT801</option>
                    <option value="linksys">Linksys SPA2102</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">Phone Line</label>
                  {(() => {
                    const addUser = users.find(u => u.id === addDeviceUserId);
                    const userNumber = addUser?.twilioNumber;
                    return userNumber ? (
                      <select
                        value={addDeviceForm.phoneNumber || userNumber}
                        onChange={(e) => setAddDeviceForm({ ...addDeviceForm, phoneNumber: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none font-mono"
                      >
                        <option value={userNumber}>{userNumber}</option>
                      </select>
                    ) : (
                      <div className="px-4 py-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm text-stone-400">
                        No phone line provisioned for this user yet
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-2">MAC Address <span className="font-normal text-stone-400">(optional)</span></label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none font-mono"
                    placeholder="00:0B:82:XX:XX:XX"
                    value={addDeviceForm.macAddress}
                    onChange={(e) => setAddDeviceForm({ ...addDeviceForm, macAddress: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={addDeviceForUser}
                    disabled={loading.add_device_for_user || !addDeviceForm.name.trim()}
                    className="flex-1 px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition disabled:opacity-50"
                  >
                    {loading.add_device_for_user ? 'Adding...' : 'Add Device'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDeviceModal(false);
                      setAddDeviceUserId(null);
                      setAddDeviceForm({ name: '', adapterType: 'grandstream', macAddress: '', phoneNumber: '' });
                    }}
                    className="px-6 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (() => {
          const stripePaid = users.filter(u => (u.plan === 'monthly' || u.plan === 'annual') && u.stripeSubscriptionId);
          const ffPaid = users.filter(u => (u.plan === 'monthly' || u.plan === 'annual') && !u.stripeSubscriptionId);
          const freeUsers = users.filter(u => u.plan === 'free');
          const mrr = stripePaid.reduce((sum, u) => sum + (u.plan === 'monthly' ? 8.95 : 85.80 / 12), 0);

          return (
            <div className="space-y-6">

              <div>
                <h2 className="text-2xl font-black text-stone-900">Billing Overview</h2>
                <p className="text-stone-500 text-sm">Revenue and subscription management</p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border-2 border-stone-100">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Stripe Paying</div>
                  <div className="text-3xl font-black text-[#C4531A]">{stripePaid.length}</div>
                  <div className="text-xs text-stone-400 mt-1">active Stripe subscriptions</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border-2 border-stone-100">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Friends &amp; Family</div>
                  <div className="text-3xl font-black text-purple-600">{ffPaid.length}</div>
                  <div className="text-xs text-stone-400 mt-1">manually granted paid plan</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border-2 border-stone-100">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Free</div>
                  <div className="text-3xl font-black text-stone-500">{freeUsers.length}</div>
                  <div className="text-xs text-stone-400 mt-1">Ring Ring–only plan</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border-2 border-[#C4531A]/20">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Est. MRR</div>
                  <div className="text-3xl font-black text-green-700">${mrr.toFixed(2)}</div>
                  <div className="text-xs text-stone-400 mt-1">Stripe only, excl. F&amp;F</div>
                </div>
              </div>

              {/* F&F notice if any */}
              {ffPaid.length > 0 && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                  <span className="text-purple-500 text-lg">ℹ️</span>
                  <p className="text-sm text-purple-800">
                    <span className="font-bold">{ffPaid.length} user{ffPaid.length !== 1 ? 's are' : ' is'} on a paid plan without an active Stripe subscription</span> — these are Friends &amp; Family accounts granted access manually via the admin. They will <span className="font-bold">not</span> generate Stripe revenue and won&apos;t renew automatically.
                  </p>
                </div>
              )}

              {/* User list */}
              <div className="bg-white rounded-2xl border-2 border-stone-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="font-black text-stone-900">All Users</h3>
                  <div className="flex items-center gap-3 text-xs font-semibold text-stone-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C4531A] inline-block" /> Stripe</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> F&amp;F</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-300 inline-block" /> Free</span>
                  </div>
                </div>
                <div className="divide-y divide-stone-100">
                  {users.map((user) => {
                    const isPaid = user.plan === 'monthly' || user.plan === 'annual';
                    const isStripe = isPaid && !!user.stripeSubscriptionId;
                    const isFF = isPaid && !user.stripeSubscriptionId;
                    const billingSource = isStripe ? 'stripe' : isFF ? 'ff' : 'free';

                    return (
                      <div key={user.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            billingSource === 'stripe' ? 'bg-[#C4531A]'
                            : billingSource === 'ff' ? 'bg-purple-400'
                            : 'bg-stone-300'
                          }`} />
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 text-sm truncate">{user.email}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {user.twilioNumber && (
                                <span className="text-xs font-mono text-stone-500">{user.twilioNumber}</span>
                              )}
                              {isStripe && user.stripeCustomerId && (
                                <span className="text-xs text-stone-400 font-mono">
                                  {user.stripeCustomerId.slice(0, 18)}…
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                          {/* Plan badge */}
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            user.plan === 'free' ? 'bg-stone-100 text-stone-500'
                            : 'bg-[#C4531A]/10 text-[#C4531A]'
                          }`}>
                            {user.plan === 'free' ? 'Free' : user.plan === 'annual' ? 'Annual' : 'Monthly'}
                          </span>

                          {/* Billing source badge */}
                          {isStripe && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#C4531A] text-white">
                              Stripe ✓
                            </span>
                          )}
                          {isFF && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                              F&amp;F / Manual
                            </span>
                          )}

                          {/* Sub ID or note */}
                          {isStripe && user.stripeSubscriptionId && (
                            <span className="text-xs text-stone-400 font-mono hidden md:inline">
                              sub: {user.stripeSubscriptionId.slice(0, 14)}…
                            </span>
                          )}
                          {isFF && (
                            <span className="text-xs text-purple-400 hidden md:inline">no Stripe sub</span>
                          )}

                          <button
                            onClick={() => { setManualBillingUser(user.id); setShowManualBilling(true); }}
                            className="px-3 py-1.5 bg-amber-100 text-amber-800 font-bold rounded-lg hover:bg-amber-200 transition text-xs"
                          >
                            Manual Billing
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })()}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            
            <div>
              <h2 className="text-2xl font-black text-stone-900">System Health & Tools</h2>
              <p className="text-stone-500 text-sm">Maintenance and monitoring</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                <h3 className="text-lg font-black text-stone-900 mb-4">🧹 SIP Cleanup</h3>
                <p className="text-sm text-stone-500 mb-6">
                  Remove orphaned SIP credentials from Twilio that are no longer tied to active devices.
                </p>
                <button
                  onClick={cleanupSip}
                  disabled={loading.cleanup_sip}
                  className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading.cleanup_sip ? 'Cleaning...' : 'Run SIP Cleanup'}
                </button>
              </div>

              <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                <h3 className="text-lg font-black text-stone-900 mb-4">📊 System Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Users</span>
                    <span className="font-bold text-stone-900">{users.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Devices</span>
                    <span className="font-bold text-stone-900">{devices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Contacts</span>
                    <span className="font-bold text-stone-900">{contacts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Online Devices</span>
                    <span className="font-bold text-green-700">{devices.filter(d => d.status).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">SIP Provisioned</span>
                    <span className="font-bold text-blue-700">{devices.filter(d => d.sipUsername).length}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-amber-50 rounded-3xl p-6 border-2 border-amber-200">
              <h3 className="text-lg font-black text-amber-900 mb-2">⚠️ Admin Notes</h3>
              <ul className="space-y-2 text-sm text-amber-800">
                <li>• Manual billing bypasses Stripe - use for F&F or special cases</li>
                <li>• SIP cleanup should be run periodically to remove orphaned credentials</li>
                <li>• Always verify device provisioning URLs before sharing with users</li>
                <li>• Free plans are limited to Ring Ring → Ring Ring calls only</li>
              </ul>
            </div>

          </div>
        )}

        {/* Edit Device Modal */}
        {showEditDeviceModal && editingDevice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowEditDeviceModal(false)}>
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-stone-900">Edit Device</h2>
                <button
                  onClick={() => setShowEditDeviceModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Device Name */}
                <div>
                  <label className="text-sm font-bold text-stone-700 mb-2 block">Device Name</label>
                  <input
                    type="text"
                    value={editDeviceForm.name}
                    onChange={(e) => setEditDeviceForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-stone-50 text-stone-900 rounded-xl px-4 py-3 border-2 border-stone-200 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Office Phone"
                  />
                </div>

                {/* Device Type */}
                <div>
                  <label className="text-sm font-bold text-stone-700 mb-2 block">Device Type</label>
                  <select
                    value={editDeviceForm.adapterType}
                    onChange={(e) => setEditDeviceForm((prev) => ({ ...prev, adapterType: e.target.value }))}
                    className="w-full bg-stone-50 text-stone-900 rounded-xl px-4 py-3 border-2 border-stone-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="linksys">Linksys SPA2102</option>
                    <option value="grandstream">Grandstream HT801</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* MAC Address */}
                <div>
                  <label className="text-sm font-bold text-stone-700 mb-2 block">MAC Address <span className="text-stone-400">(optional)</span></label>
                  <input
                    type="text"
                    value={editDeviceForm.macAddress}
                    onChange={(e) => {
                      let val = e.target.value.toUpperCase().replace(/[^A-F0-9:]/g, '');
                      // Auto-insert colons
                      const hex = val.replace(/:/g, '');
                      if (hex.length > 2 && !val.includes(':')) {
                        val = hex.match(/.{1,2}/g)?.join(':') || val;
                      }
                      if (val.length <= 17) {
                        setEditDeviceForm((prev) => ({ ...prev, macAddress: val }));
                      }
                    }}
                    className="w-full bg-stone-50 text-stone-900 rounded-xl px-4 py-3 border-2 border-stone-200 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="e.g. C0:74:AD:12:34:56"
                  />
                </div>

                {/* Device Info */}
                <div className="bg-stone-50 rounded-xl p-4 border-2 border-stone-200">
                  <p className="text-xs font-bold text-stone-600 mb-2">Device Info (read-only)</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Device ID:</span>
                      <span className="font-mono text-stone-600">{editingDevice.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">SIP Username:</span>
                      <span className="font-mono text-stone-600">{editingDevice.sipUsername || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Owner:</span>
                      <span className="text-stone-600">{users.find(u => u.id === editingDevice.userId)?.email || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={saveDevice}
                    disabled={loading[`edit_${editingDevice.id}`] || !editDeviceForm.name.trim()}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {loading[`edit_${editingDevice.id}`] ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setShowEditDeviceModal(false)}
                    className="flex-1 px-4 py-3 bg-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
