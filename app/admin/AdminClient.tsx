'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Device = {
  id: string;
  userId: string;
  name: string;
  sipUsername: string | null;
  adapterType: string | null;
  adapterIp: string | null;
};

type User = {
  id: string;
  email: string;
};

export default function AdminClient({
  users,
  devices: initialDevices,
}: {
  users: User[];
  devices: Device[];
}) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [results, setResults] = useState<{ [key: string]: { username: string; password: string } }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [showAddDevice, setShowAddDevice] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState({ name: '', adapterType: 'linksys' });
  const [addingDevice, setAddingDevice] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  const copyProvisionUrl = (deviceId: string) => {
    const url = `${window.location.origin}/api/provision/${deviceId}/linksys.cfg`;
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
        setResults((prev) => ({
          ...prev,
          [deviceId]: { username: data.sipUsername, password: data.sipPassword },
        }));
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...d, sipUsername: data.sipUsername } : d
          )
        );
      } else {
        setErrors((prev) => ({
          ...prev,
          [deviceId]: data.error ?? 'Failed to create SIP user',
        }));
      }
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [deviceId]: err.message ?? 'Network error' }));
    }

    setLoading((prev) => ({ ...prev, [deviceId]: false }));
  };

  const resetSip = async (deviceId: string, userId: string) => {
    if (!confirm('Reset SIP credentials for this device? The old credentials will stop working.')) return;
    setLoading((prev) => ({ ...prev, [`reset_${deviceId}`]: true }));
    setErrors((prev) => ({ ...prev, [deviceId]: '' }));

    try {
      await fetch('/api/sip/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });

      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, sipUsername: null } : d))
      );

      await createSipUser(deviceId, userId);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [deviceId]: err.message ?? 'Reset failed' }));
    }

    setLoading((prev) => ({ ...prev, [`reset_${deviceId}`]: false }));
  };

  const addDevice = async (userId: string) => {
    if (!newDevice.name.trim()) return;
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
        setNewDevice({ name: '', adapterType: 'linksys' });
        setShowAddDevice(null);
      } else {
        alert(data.error ?? 'Failed to add device');
      }
    } catch (err: any) {
      alert(err.message ?? 'Network error');
    }

    setAddingDevice(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <h1 className="text-3xl font-bold mb-2">Admin – Users & Devices</h1>
      <p className="text-slate-400 text-sm mb-8">
        {users.length} user(s) • {devices.length} device(s)
      </p>

      {users.length === 0 && (
        <div className="text-slate-500 text-sm">No users found in database.</div>
      )}

      <div className="space-y-6">
        {users.map((u) => {
          const userDevices = devices.filter((d) => d.userId === u.id);

          return (
            <div key={u.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              {/* User Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-semibold text-white">{u.email}</div>
                  <div className="text-xs text-slate-500 mt-0.5">ID: {u.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                    {userDevices.length} device(s)
                  </span>
                  <button
                    onClick={() =>
                      setShowAddDevice(showAddDevice === u.id ? null : u.id)
                    }
                    className="text-xs bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded text-white font-medium transition-colors"
                  >
                    + Add Device
                  </button>
                </div>
              </div>

              {/* Add Device Form */}
              {showAddDevice === u.id && (
                <div className="mb-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="text-sm font-semibold mb-3">New Device</div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 mb-1 block">Device Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Office Phone"
                        value={newDevice.name}
                        onChange={(e) =>
                          setNewDevice((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full bg-slate-700 text-white text-sm rounded px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Type</label>
                      <select
                        value={newDevice.adapterType}
                        onChange={(e) =>
                          setNewDevice((prev) => ({ ...prev, adapterType: e.target.value }))
                        }
                        className="bg-slate-700 text-white text-sm rounded px-3 py-2 border border-slate-600 focus:outline-none"
                      >
                        <option value="linksys">Linksys</option>
                        <option value="grandstream">Grandstream</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <button
                      onClick={() => addDevice(u.id)}
                      disabled={addingDevice || !newDevice.name.trim()}
                      className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded text-white font-medium transition-colors"
                    >
                      {addingDevice ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => setShowAddDevice(null)}
                      className="text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Devices */}
              {userDevices.length === 0 ? (
                <div className="text-sm text-slate-500 italic">No devices yet</div>
              ) : (
                <div className="space-y-2">
                  {userDevices.map((d) => (
                    <div
                      key={d.id}
                      className="bg-slate-800/60 rounded-lg px-4 py-3 border border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">
                            {d.name}{' '}
                            <span className="text-slate-400 text-xs">
                              ({d.adapterType ?? 'unknown'})
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            IP: {d.adapterIp ?? 'none'} • SIP:{' '}
                            {d.sipUsername ?? 'not provisioned'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {/* ✅ CHANGED: Copy button instead of download link */}
                          {d.sipUsername && (
                            <button
                              onClick={() => copyProvisionUrl(d.id)}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                            >
                              {copiedId === d.id ? (
                                <span className="text-green-400">✅ Copied!</span>
                              ) : (
                                <span>📋 Copy Provision URL</span>
                              )}
                            </button>
                          )}

                          {d.sipUsername ? (
                            <>
                              <span className="text-xs text-green-400 font-medium">
                                ✅ SIP Active
                              </span>
                              <button
                                onClick={() => resetSip(d.id, u.id)}
                                disabled={loading[`reset_${d.id}`]}
                                className="text-xs bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 px-3 py-1.5 rounded text-white font-medium transition-colors"
                              >
                                {loading[`reset_${d.id}`] ? 'Resetting...' : '🔄 Reset SIP'}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => createSipUser(d.id, u.id)}
                              disabled={loading[d.id]}
                              className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded text-white font-medium transition-colors"
                            >
                              {loading[d.id] ? 'Creating...' : 'Create SIP'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Success */}
                      {results[d.id] && (
                        <div className="mt-3 p-3 bg-green-900/40 border border-green-700 rounded text-xs text-green-300">
                          <div className="font-semibold mb-1">✅ SIP Credentials Created</div>
                          <div>Username: <span className="font-mono">{results[d.id].username}</span></div>
                          <div>Password: <span className="font-mono">{results[d.id].password}</span></div>
                          <div className="text-green-500 mt-1">⚠️ Save these — password won't be shown again.</div>
                        </div>
                      )}

                      {/* Error */}
                      {errors[d.id] && (
                        <div className="mt-3 p-3 bg-red-900/40 border border-red-700 rounded text-xs text-red-300">
                          ❌ {errors[d.id]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
