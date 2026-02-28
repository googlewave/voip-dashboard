'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Device {
  id: string;
  name: string;
  status: boolean;
  created_at: string;
}

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });
      setDevices(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const addDevice = async () => {
    if (!newDeviceName.trim()) return;
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('devices')
        .insert({ name: newDeviceName.trim(), status: false });
      if (!error) {
        setNewDeviceName('');
        await fetchDevices();
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('devices')
        .update({ status: !currentStatus })
        .eq('id', id);
      if (!error) await fetchDevices();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteDevice = async (id: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);
      if (!error) await fetchDevices();
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          VoIP Device Dashboard
        </h1>

        {/* Add Device */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Add New Device</h2>
          <div className="flex gap-4">
            <input
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Extension 101, Reception Phone..."
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDevice()}
            />
            <button
              className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              onClick={addDevice}
              disabled={loading || !newDeviceName.trim()}
            >
              {loading ? 'Adding...' : 'Add Device'}
            </button>
          </div>
        </div>

        {/* Devices List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold text-gray-900">
              Devices ({devices.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-6 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      device.status ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{device.name}</h3>
                    <p className="text-sm text-gray-500">
                      {device.created_at
                        ? new Date(device.created_at).toLocaleString()
                        : 'Just now'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      device.status
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    onClick={() => toggleStatus(device.id, device.status)}
                  >
                    {device.status ? 'Set Offline' : 'Set Online'}
                  </button>
                  <button
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                    onClick={() => deleteDevice(device.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {devices.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p className="text-xl mb-4">No devices yet</p>
              <p>Add your first VoIP device above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
