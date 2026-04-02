'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Device {
  id: string;
  name: string;
  sip_username: string | null;
}

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [myDevices, setMyDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadInvite();
  }, []);

  const checkAuthAndLoadInvite = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login with return URL
        router.push(`/login?redirect=/invite/${token}`);
        return;
      }

      setUser(session.user);

      // Fetch invite details
      const inviteRes = await fetch(`/api/friends/invite/${token}`);
      const inviteData = await inviteRes.json();

      if (!inviteRes.ok) {
        setError(inviteData.error || 'Invalid invite');
        setLoading(false);
        return;
      }

      setSenderEmail(inviteData.senderEmail);

      // Fetch user's devices
      const { data: devices } = await supabase
        .from('devices')
        .select('id, name, sip_username')
        .eq('user_id', session.user.id);

      setMyDevices(devices || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading invite:', err);
      setError('Failed to load invite');
      setLoading(false);
    }
  };

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const acceptInvite = async () => {
    if (selectedDevices.length === 0) {
      setError('Please select at least one device');
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`/api/friends/invite/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ deviceIds: selectedDevices }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to accept invite');
        setAccepting(false);
        return;
      }

      // Success! Redirect to dashboard
      router.push('/dashboard?invite_accepted=true');
    } catch (err: any) {
      console.error('Error accepting invite:', err);
      setError('Failed to accept invite');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-stone-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border-2 border-red-200 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-black text-stone-900 mb-2">Invite Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border-2 border-stone-100">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">👥</div>
          <h1 className="text-2xl font-black text-stone-900 mb-2">
            Friend Invite
          </h1>
          <p className="text-stone-600">
            <strong>{senderEmail}</strong> wants to connect on Ring Ring
          </p>
        </div>

        {/* Device Selection */}
        <div className="mb-6">
          <p className="text-sm font-bold text-stone-900 mb-3">
            Which of your devices can connect?
          </p>
          {myDevices.length === 0 ? (
            <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200 text-center">
              <p className="text-sm text-amber-900 font-bold mb-2">No devices yet</p>
              <p className="text-xs text-amber-800">Add a device first, then accept this invite.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myDevices.map(device => (
                <label
                  key={device.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    selectedDevices.includes(device.id)
                      ? 'border-[#C4531A] bg-orange-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.id)}
                    onChange={() => toggleDevice(device.id)}
                    className="w-5 h-5"
                  />
                  <span className="font-medium text-stone-900">{device.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Accept Button */}
        <button
          onClick={acceptInvite}
          disabled={accepting || selectedDevices.length === 0 || myDevices.length === 0}
          className="w-full px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {accepting ? 'Accepting...' : 'Accept & Connect'}
        </button>

        {/* Safety Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
          <p className="text-xs text-blue-900">
            <strong>🔒 Safe & Private:</strong> Only selected devices will be able to call each other. You can remove this connection at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
