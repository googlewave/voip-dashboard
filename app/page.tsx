'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface Device {
  id: string;
  name: string;
  status: boolean;
  created_at: string;
  voip_provider: string;
  phone_number: string | null;
  contacts?: Contact[];
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else {
        setUser(session.user);
        fetchDevices();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login');
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchDevices = async () => {
    const { data: devicesData } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!devicesData) return;

    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*');

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
    setLoading(true);
    const { error } = await supabase
      .from('devices')
      .insert({ name: newDeviceName.trim(), status: false, user_id: user.id });
    if (!error) {
      setNewDeviceName('');
      await fetchDevices();
    }
    setLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('devices').update({ status: !currentStatus }).eq('id', id);
    await fetchDevices();
  };

  const deleteDevice = async (id: string) => {
    await supabase.from('devices').delete().eq('id', id);
    if (selectedDevice?.id === id) setSelectedDevice(null);
    await fetchDevices();
  };

  const addContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim() || !selectedDevice || !user) return;
    setContactLoading(true);
    const { error } = await supabase.from('contacts').insert({
      device_id: selectedDevice.id,
      user_id: user.id,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
    });
    if (!error) {
      setNewContactName('');
      setNewContactPhone('');
      await fetchDevices();
    }
    setContactLoading(false);
  };

  const deleteContact = async (contactId: string) => {
    await supabase.from('contacts').delete().eq('id', contactId);
    await fetchDevices();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!mounted || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">VoIP Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT — Devices */}
          <div>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Add New Device</h2>
              <div className="flex gap-3">
                <input
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kid's Phone, Extension 101..."
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDevice()}
                />
                <button
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  onClick={addDevice}
                  disabled={loading || !newDeviceName.trim()}
                >
                  {loading ? '...' : 'Add'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-5 border-b">
                <h2 className="text-xl font-semibold">Devices ({devices.length})</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`p-5 hover:bg-gray-50 cursor-pointer ${selectedDevice?.id === device.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${device.status ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <h3 className="font-semibold">{device.name}</h3>
                          <p className="text-xs text-gray-400">
                            {device.contacts?.length || 0} contact{device.contacts?.length !== 1 ? 's' : ''}
                            {device.phone_number && (
                              <span className="ml-2 font-mono">{device.phone_number}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                            device.status
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          onClick={(e) => { e.stopPropagation(); toggleStatus(device.id, device.status); }}
                        >
                          {device.status ? 'Set Offline' : 'Set Online'}
                        </button>
                        <button
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                          onClick={(e) => { e.stopPropagation(); deleteDevice(device.id); }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {devices.length === 0 && (
                <div className="p-10 text-center text-gray-500">
                  <p className="text-lg mb-2">No devices yet</p>
                  <p className="text-sm">Add your first device above!</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Contacts */}
          <div>
            {selectedDevice ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-5 border-b bg-blue-50">
                  <h2 className="text-xl font-semibold text-gray-900">📋 {selectedDevice.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Approved Contacts</p>
                </div>

                <div className="p-5 border-b">
                  <div className="flex flex-col gap-3">
                    <input
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact name (e.g. Mom)"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <input
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Phone number"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addContact()}
                      />
                      <button
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        onClick={addContact}
                        disabled={contactLoading || !newContactName.trim() || !newContactPhone.trim()}
                      >
                        {contactLoading ? '...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {selectedDevice.contacts?.map((contact) => (
                    <div key={contact.id} className="p-5 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-sm text-gray-500">{contact.phone}</p>
                      </div>
                      <button
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                        onClick={() => deleteContact(contact.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {selectedDevice.contacts?.length === 0 && (
                  <div className="p-10 text-center text-gray-500">
                    <p className="text-lg mb-2">No contacts yet</p>
                    <p className="text-sm">Add approved contacts above!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-10 text-center text-gray-400">
                <p className="text-5xl mb-4">👈</p>
                <p className="text-lg font-medium">Select a device</p>
                <p className="text-sm mt-1">to manage its approved contacts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
