'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';

type FriendDevice = {
  id: string;
  name: string;
  status?: boolean;
  sip_username?: string | null;
};

type Friendship = {
  id: string;
  friendEmail?: string;
  friendDevices?: FriendDevice[];
};

type PendingInvite = {
  id: string;
  expires_at: string;
};

interface FriendsTabProps {
  user: User | null;
}

export default function FriendsTab({ user }: FriendsTabProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFriends() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/friends', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      const data = await res.json();
      setFriendships(data.friendships || []);
      setPendingInvites(data.sentInvites || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        void fetchFriends();
      });
    }
  }, [user]);

  const createInvite = async () => {
    setCreatingInvite(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/friends/invite/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      const data = await res.json();
      setInviteUrl(data.inviteUrl);
      setShowInviteModal(true);
      await fetchFriends();
    } catch (error) {
      console.error('Error creating invite:', error);
    }
    setCreatingInvite(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-stone-500">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 border-2 border-[#C4531A]/20">
        <div className="flex items-start gap-6">
          <div className="text-6xl">👥</div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-stone-900 mb-2">Connect with Other Families</h2>
            <p className="text-stone-600 mb-4">
              Ring Ring requires mutual parent approval before kids can call each other. No strangers, no surprises.
            </p>
            <button
              onClick={createInvite}
              disabled={creatingInvite}
              className="px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50"
            >
              {creatingInvite ? 'Creating...' : '✨ Create Friend Invite'}
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
        <h3 className="text-lg font-black text-stone-900 mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📱</div>
            <div className="text-sm font-bold text-stone-900 mb-1">1. Share Invite</div>
            <div className="text-xs text-stone-500">QR code, email, or text</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-sm font-bold text-stone-900 mb-1">2. They Accept</div>
            <div className="text-xs text-stone-500">Both parents approve</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📞</div>
            <div className="text-sm font-bold text-stone-900 mb-1">3. Kids Call</div>
            <div className="text-xs text-stone-500">Safe & supervised</div>
          </div>
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h3 className="text-lg font-black text-stone-900">Pending Invites ({pendingInvites.length})</h3>
          </div>
          <div className="divide-y divide-stone-100">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900">Invite sent</p>
                  <p className="text-sm text-stone-500">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Friends */}
      {friendships.length > 0 ? (
        <div className="bg-white rounded-3xl border-2 border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h3 className="text-lg font-black text-stone-900">Connected Families ({friendships.length})</h3>
          </div>
          <div className="divide-y divide-stone-100">
            {friendships.map((friendship) => (
              <div key={friendship.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-700 text-xl">✓</span>
                    </div>
                    <div>
                      <p className="font-black text-stone-900">{friendship.friendEmail}</p>
                      <p className="text-sm text-stone-500">
                        {friendship.friendDevices?.length || 0} device(s) connected
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Friend's Devices */}
                {friendship.friendDevices && friendship.friendDevices.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold text-stone-600 uppercase tracking-wide">Their Devices:</p>
                    {friendship.friendDevices.map((device) => (
                      <div key={device.id} className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl">
                        <div className={`w-2 h-2 rounded-full ${device.status ? 'bg-green-500' : 'bg-stone-300'}`} />
                        <span className="text-sm font-medium text-stone-900">{device.name}</span>
                        <span className="text-xs text-stone-400 ml-auto">
                          {device.sip_username ? 'Ready to call' : 'Not provisioned'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 border-2 border-stone-100 text-center">
          <div className="text-6xl mb-4">🤝</div>
          <p className="text-xl font-black text-stone-900 mb-2">No connections yet</p>
          <p className="text-stone-500">Create an invite to connect with another family</p>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-stone-900">Share Friend Invite</h2>
                <p className="text-sm text-stone-500 mt-1">Choose how to connect with another parent</p>
              </div>
              <button 
                onClick={() => setShowInviteModal(false)} 
                className="text-stone-400 hover:text-stone-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* QR Code */}
            <div className="bg-stone-50 rounded-2xl p-6 border-2 border-stone-200 mb-6">
              <p className="text-sm font-bold text-stone-700 mb-4 text-center">
                📱 Show this QR code to another parent
              </p>
              <div className="bg-white p-6 rounded-xl inline-block mx-auto block shadow-lg">
                <QRCodeSVG
                  value={inviteUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-stone-500 mt-4 text-center">
                They can scan with their phone camera
              </p>
            </div>

            {/* Share Link */}
            <div className="mb-6">
              <p className="text-xs font-bold text-stone-600 mb-3 uppercase tracking-wide">Or share the link:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 text-sm font-mono bg-white"
                />
                <button
                  onClick={() => copyToClipboard(inviteUrl)}
                  className="px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Share Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => {
                  window.location.href = `mailto:?subject=Ring Ring Friend Invite&body=Join me on Ring Ring! ${inviteUrl}`;
                }}
                className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition text-left"
              >
                <div className="text-2xl mb-2">📧</div>
                <div className="text-sm font-bold text-blue-900">Send via Email</div>
                <div className="text-xs text-blue-700">Opens your email app</div>
              </button>
              <button
                onClick={() => {
                  window.location.href = `sms:?body=Join me on Ring Ring! ${inviteUrl}`;
                }}
                className="p-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 transition text-left"
              >
                <div className="text-2xl mb-2">💬</div>
                <div className="text-sm font-bold text-green-900">Send via Text</div>
                <div className="text-xs text-green-700">Opens your messages app</div>
              </button>
            </div>

            {/* Safety Note */}
            <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <p className="text-xs font-bold text-blue-900 mb-1">🔒 Safe & Private</p>
              <p className="text-xs text-blue-800">
                This invite expires in 7 days. Only the recipient can accept it. You can cancel anytime.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
