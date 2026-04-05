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
  adapter_type: string | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  usage_cap_enabled: boolean;
  usage_cap_minutes: number | null;
  phone_number: string | null;
  contacts?: Contact[];
}

interface UserProfile {
  plan: string;
  twilio_number: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  e911_name: string | null;
  e911_street: string | null;
  e911_city: string | null;
  e911_state: string | null;
  e911_zip: string | null;
  two_factor_enabled: boolean;
}

type Subscription = {
  id: string;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  interval: string;
};

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

type Tab = 'devices' | 'contacts' | 'friends' | 'store' | 'lines' | 'settings';

type Invoice = {
  id: string;
  amount: number;
  currency: string;
  status: string | null;
  date: number;
  description: string;
  pdf: string | null;
};

type NetworkTestAnalysis = {
  outcome: 'ready' | 'router-blocking' | 'wrong-url' | 'server-issue' | 'mixed-failure' | 'unknown';
  severity: 'success' | 'warning' | 'error';
  title: string;
  summary: string;
  actions: string[];
};

type SavedNetworkTest = {
  id: string;
  deviceId: string;
  provisioningUrl: string;
  outcome: string;
  summary: string;
  createdAt: string;
  clientIp: string | null;
  analysis: NetworkTestAnalysis;
};

type NetworkTestProbe = {
  ok: boolean;
  status: number;
  durationMs: number;
  looksLikeProvisioning: boolean;
  error?: string;
};

type SetupDeviceOption = {
  id: string;
  name: string;
  adapterType: string | null;
  phoneNumber: string | null;
};

function networkSeverityClass(severity: NetworkTestAnalysis['severity']) {
  if (severity === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (severity === 'error') return 'border-red-200 bg-red-50 text-red-900';
  return 'border-amber-200 bg-amber-50 text-amber-900';
}

function getParentFacingNetworkCopy(analysis: NetworkTestAnalysis) {
  if (analysis.outcome === 'ready') {
    return {
      title: 'You are ready for setup',
      summary: 'Your setup link is working on your home network. You can continue below.',
    };
  }

  if (analysis.outcome === 'wrong-url') {
    return {
      title: 'This setup link does not look right yet',
      summary: 'The link opened, but it did not return the setup file we expected. Double-check that you picked the right phone below.',
    };
  }

  if (analysis.outcome === 'router-blocking') {
    return {
      title: 'Your router is getting in the way',
      summary: 'Our system is ready, but your home network blocked or changed the request. Try the check again after turning off filtering or guest Wi-Fi.',
    };
  }

  if (analysis.outcome === 'server-issue') {
    return {
      title: 'We need to check something on our side',
      summary: 'Your browser reached the link, but our backend validation did not fully pass. Please contact us and we can finish the setup with you.',
    };
  }

  if (analysis.outcome === 'mixed-failure') {
    return {
      title: 'Setup check failed',
      summary: 'We could not confirm the link from your side or ours. Please rerun the check once, then contact us if it still fails.',
    };
  }

  return {
    title: 'Setup check needs another try',
    summary: 'We could not clearly confirm the result. Please run the check once more.',
  };
}

function SetupGuidePanel({
  deviceId,
  deviceName,
  adapterType,
  phoneNumber,
  setupDevices,
  onSelectDevice,
}: {
  deviceId: string;
  deviceName: string;
  adapterType?: string | null;
  phoneNumber?: string | null;
  setupDevices: SetupDeviceOption[];
  onSelectDevice: (deviceId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [networkResult, setNetworkResult] = useState<SavedNetworkTest | null>(null);
  const [loadingNetworkResult, setLoadingNetworkResult] = useState(true);
  const [runningNetworkCheck, setRunningNetworkCheck] = useState(false);
  const [networkCheckError, setNetworkCheckError] = useState<string | null>(null);

  const typeParam = adapterType === 'linksys' ? '?type=linksys' : adapterType === 'grandstream' ? '?type=grandstream' : '';
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/api/provision/auto/${deviceId}${typeParam}`
    : `/api/provision/auto/${deviceId}${typeParam}`;

  const loadNetworkResult = async () => {
    const res = await fetch(`/api/network-test/result?deviceId=${encodeURIComponent(deviceId)}`, { cache: 'no-store' });
    const data = await res.json();
    setNetworkResult(data.result ?? null);
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      setLoadingNetworkResult(true);
      try {
        const res = await fetch(`/api/network-test/result?deviceId=${encodeURIComponent(deviceId)}`, { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        setNetworkResult(data.result ?? null);
      } catch {
        if (!active) return;
        setNetworkResult(null);
      } finally {
        if (active) setLoadingNetworkResult(false);
      }
    };

    void init();

    return () => {
      active = false;
    };
  }, [deviceId]);

  const runNetworkCheck = async () => {
    setRunningNetworkCheck(true);
    setNetworkCheckError(null);

    try {
      const startedAt = performance.now();
      let browser: NetworkTestProbe;

      try {
        const browserResponse = await fetch(url, { cache: 'no-store' });
        const preview = await browserResponse.text();
        browser = {
          ok: browserResponse.ok,
          status: browserResponse.status,
          durationMs: Math.round(performance.now() - startedAt),
          looksLikeProvisioning: /<flat-profile>|<gs_provision|Provisioning failed|Device not found/i.test(preview),
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Browser fetch failed';
        browser = {
          ok: false,
          status: 0,
          durationMs: Math.round(performance.now() - startedAt),
          looksLikeProvisioning: false,
          error: message,
        };
      }

      const serverResponse = await fetch('/api/network-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const serverData = await serverResponse.json();

      const server: NetworkTestProbe = {
        ok: !!serverData.ok,
        status: Number(serverData.status ?? 0),
        durationMs: Number(serverData.durationMs ?? 0),
        looksLikeProvisioning: !!serverData.looksLikeProvisioning,
        error: serverData.error || undefined,
      };

      await fetch('/api/network-test/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          provisioningUrl: url,
          browser,
          server,
        }),
      });

      await loadNetworkResult();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not run network check.';
      setNetworkCheckError(message);
    } finally {
      setRunningNetworkCheck(false);
    }
  };

  const networkReady = networkResult?.analysis.outcome === 'ready';
  const parentFacingCopy = networkResult ? getParentFacingNetworkCopy(networkResult.analysis) : null;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Step 1</p>
        <h4 className="mt-1 text-lg font-black text-stone-900">Make sure this is the right phone</h4>
        <p className="mt-1 text-sm text-stone-600">
          You are setting up <span className="font-bold text-stone-900">{deviceName}</span>
          {phoneNumber ? ` for ${phoneNumber}` : ''}.
        </p>
        {setupDevices.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {setupDevices.map((device) => (
              <button
                key={device.id}
                onClick={() => onSelectDevice(device.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${device.id === deviceId ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
              >
                {device.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`rounded-2xl border p-4 ${networkResult ? networkSeverityClass(networkResult.analysis.severity) : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Step 2</p>
            <h4 className="text-lg font-black">Run one quick connection check</h4>
            <p className="mt-1 text-sm opacity-80">Tap the button below while your phone adapter is on the same home network.</p>
          </div>
          <button
            onClick={runNetworkCheck}
            disabled={runningNetworkCheck}
            className="inline-flex items-center justify-center rounded-full bg-white/80 px-4 py-2 text-xs font-black text-stone-900 hover:bg-white transition disabled:opacity-60"
          >
            {runningNetworkCheck ? 'Checking…' : 'Run Connection Check'}
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3">
          {loadingNetworkResult ? (
            <p className="text-sm">Checking your latest result…</p>
          ) : networkResult ? (
            <div className="space-y-1.5">
              <p className="text-sm font-black">{parentFacingCopy?.title}</p>
              <p className="text-sm">{parentFacingCopy?.summary}</p>
              <p className="text-xs opacity-70">Last checked {new Date(networkResult.createdAt).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-sm">No check run yet. Start with the button above.</p>
          )}

          {networkCheckError && <p className="mt-2 text-sm text-red-700">{networkCheckError}</p>}
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${networkReady ? 'border-stone-200 bg-white' : 'border-stone-200 bg-stone-50/80 opacity-80'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Step 3</p>
            <p className="text-sm font-bold text-stone-700 mb-2">Copy your setup link</p>
          </div>
          {!networkReady && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Run Step 2 first</span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
          <code className="flex-1 text-xs text-stone-700 break-all font-mono">{url}</code>
          <button
            onClick={copy}
            disabled={!networkReady}
            className="shrink-0 px-3 py-1.5 bg-[#C4531A] text-white text-xs font-bold rounded-lg hover:bg-[#a84313] transition disabled:opacity-60"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${networkReady ? 'border-stone-200 bg-white' : 'border-stone-200 bg-stone-50/80 opacity-80'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Step 4</p>
            <p className="text-sm font-bold text-stone-700 mb-2">Paste link into your adapter</p>
          </div>
        </div>
        <ol className="space-y-2 text-sm text-stone-600">
          <li>1. Open your adapter page in a browser using its local IP (example: <span className="font-mono">http://192.168.1.50</span>).</li>
          <li>2. Sign in and find <strong>Provisioning</strong> or <strong>Config Server</strong>.</li>
          <li>3. Paste your copied link, click <strong>Save / Apply</strong>, then wait about 1 minute for reboot.</li>
        </ol>
        <p className="mt-3 text-sm text-stone-500">After reboot, pick up the phone and check for dial tone.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800"><strong>Need help right now?</strong> Email <a href="mailto:hello@ringring.club" className="underline">hello@ringring.club</a> and we will guide you live.</p>
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
  const [deviceSettingsId, setDeviceSettingsId] = useState<string | null>(null);

  // Store / invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [cancellingSubId, setCancellingSubId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [e911LineOpen, setE911LineOpen] = useState<string | null>(null);

  // E911
  const [e911Name, setE911Name] = useState('');
  const [e911Street, setE911Street] = useState('');
  const [e911City, setE911City] = useState('');
  const [e911State, setE911State] = useState('');
  const [e911Zip, setE911Zip] = useState('');
  const [savingE911, setSavingE911] = useState(false);
  const [e911Saved, setE911Saved] = useState(false);

  // Account
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{type:'ok'|'err'; text:string} | null>(null);
  const [toggling2FA, setToggling2FA] = useState(false);

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
      .select('plan, twilio_number, stripe_customer_id, stripe_sub_id, e911_name, e911_street, e911_city, e911_state, e911_zip, two_factor_enabled')
      .eq('id', userId)
      .single();

    if (profileData) {
      setProfile({
        ...profileData,
        stripe_subscription_id: profileData.stripe_sub_id,
      });
      setE911Name(profileData.e911_name ?? '');
      setE911Street(profileData.e911_street ?? '');
      setE911City(profileData.e911_city ?? '');
      setE911State(profileData.e911_state ?? '');
      setE911Zip(profileData.e911_zip ?? '');
    }

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

    const devicesWithContacts: Device[] = devicesData.map((device: Device) => ({
      ...device,
      contacts: (contactsData || []).filter((c: Contact) => c.device_id === device.id),
    }));

    setDevices(devicesWithContacts);

    if (selectedDevice) {
      const updated = devicesWithContacts.find((d: Device) => d.id === selectedDevice.id);
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
        phone_number: profile?.twilio_number ?? null,
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

  const fetchSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const res = await fetch('/api/billing/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions ?? []);
      }
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const cancelSubscription = async (subId: string) => {
    setCancellingSubId(subId);
    setConfirmCancelId(null);
    await fetch('/api/billing/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: subId }),
    });
    setCancellingSubId(null);
    await fetchSubscriptions();
  };

  const cancelNumber = async () => {
    setConfirmCancelId(null);
    setCancellingSubId('direct');
    await fetch('/api/billing/cancel-number', { method: 'POST' });
    setCancellingSubId(null);
    await fetchData(user!.id);
  };

  const saveE911 = async () => {
    if (!user) return;
    setSavingE911(true);
    await supabase.from('users').update({
      e911_name: e911Name,
      e911_street: e911Street,
      e911_city: e911City,
      e911_state: e911State,
      e911_zip: e911Zip,
    }).eq('id', user.id);
    setSavingE911(false);
    setE911Saved(true);
    setTimeout(() => setE911Saved(false), 3000);
  };

  const updateEmail = async () => {
    if (!newEmail.trim()) return;
    setSavingAccount(true);
    setAccountMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setSavingAccount(false);
    if (error) setAccountMsg({ type: 'err', text: error.message });
    else { setAccountMsg({ type: 'ok', text: 'Confirmation sent — check your new email inbox.' }); setNewEmail(''); }
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setAccountMsg({ type: 'err', text: 'Passwords do not match.' }); return;
    }
    if (newPassword.length < 8) {
      setAccountMsg({ type: 'err', text: 'Password must be at least 8 characters.' }); return;
    }
    setSavingAccount(true);
    setAccountMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingAccount(false);
    if (error) setAccountMsg({ type: 'err', text: error.message });
    else { setAccountMsg({ type: 'ok', text: 'Password updated successfully.' }); setNewPassword(''); setConfirmPassword(''); }
  };

  const toggle2FA = async () => {
    if (!user || !profile) return;
    setToggling2FA(true);
    const newVal = !profile.two_factor_enabled;
    await supabase.from('users').update({ two_factor_enabled: newVal }).eq('id', user.id);
    setProfile((p) => p ? { ...p, two_factor_enabled: newVal } : p);
    setToggling2FA(false);
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
              <button
                onClick={() => { setActiveTab('lines'); void fetchSubscriptions(); }}
                className={activeTab === 'lines' ? 'text-stone-900' : 'hover:text-stone-800 transition'}
              >
                Phone Lines
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
                    {devices.map((device) => {
                      const setupGuideDevices = devices
                        .filter((item) => item.sip_username)
                        .map((item) => ({
                          id: item.id,
                          name: item.name,
                          adapterType: item.adapter_type,
                          phoneNumber: item.phone_number,
                        }));

                      return (
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
                                {device.phone_number ? (
                                  <span className="font-mono font-bold text-blue-600">{device.phone_number}</span>
                                ) : (
                                  <span className="text-stone-400">No line connected</span>
                                )}
                                <span>·</span>
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
                                const opening = deviceSettingsId !== device.id;
                                setDeviceSettingsId(opening ? device.id : null);
                                if (opening) applySelectedDevice(device);
                              }}
                              className={`px-4 py-2 font-bold rounded-xl transition text-sm ${
                                deviceSettingsId === device.id
                                  ? 'bg-stone-800 text-white'
                                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                              }`}
                            >
                              Settings
                            </button>
                            <button
                              onClick={() => {
                                applySelectedDevice(device);
                                setActiveTab('contacts');
                                void fetchFriendDevices();
                              }}
                              className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition text-sm"
                            >
                              Contacts
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
                            <SetupGuidePanel
                              deviceId={device.id}
                              deviceName={device.name}
                              adapterType={device.adapter_type}
                              phoneNumber={device.phone_number}
                              setupDevices={setupGuideDevices}
                              onSelectDevice={setShowSetupGuide}
                            />
                          </div>
                        )}

                        {/* Device Settings (inline) */}
                        {deviceSettingsId === device.id && selectedDevice?.id === device.id && (
                          <div className="mt-4 pt-4 border-t border-stone-100 space-y-5">

                            {/* Kill Switch */}
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-black text-stone-900">🔴 Digital Kill Switch</p>
                                <p className="text-sm text-stone-500">Take the phone offline instantly. Back on just as fast.</p>
                              </div>
                              <button
                                onClick={() => toggleDevice(device.id, device.status)}
                                className={`shrink-0 px-5 py-2.5 font-bold rounded-xl transition text-sm ${
                                  device.status ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              >
                                {device.status ? 'Turn Off' : 'Turn On'}
                              </button>
                            </div>

                            {/* Quiet Hours */}
                            {isPaid && (
                              <div className="space-y-3">
                                <p className="font-black text-stone-900">🌙 Quiet Hours</p>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={quietHoursEnabled}
                                    onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-stone-300"
                                  />
                                  <span className="text-sm font-bold text-stone-700">Enable quiet hours</span>
                                </label>
                                {quietHoursEnabled && (
                                  <div className="grid grid-cols-2 gap-3 pl-8">
                                    <div>
                                      <label className="block text-xs font-bold text-stone-700 mb-1">Start</label>
                                      <input type="time" value={quietHoursStart} onChange={(e) => setQuietHoursStart(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-sm" />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-stone-700 mb-1">End</label>
                                      <input type="time" value={quietHoursEnd} onChange={(e) => setQuietHoursEnd(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-sm" />
                                    </div>
                                  </div>
                                )}
                                <button onClick={saveQuietHours} disabled={savingQuietHours}
                                  className="px-5 py-2 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50 text-sm">
                                  {savingQuietHours ? 'Saving...' : 'Save Quiet Hours'}
                                </button>
                              </div>
                            )}

                            {/* Usage Cap */}
                            {isPaid && (
                              <div className="space-y-3">
                                <p className="font-black text-stone-900">⏱️ Daily Usage Cap</p>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={usageCapEnabled}
                                    onChange={(e) => setUsageCapEnabled(e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-stone-300"
                                  />
                                  <span className="text-sm font-bold text-stone-700">Enable usage cap</span>
                                </label>
                                {usageCapEnabled && (
                                  <div className="pl-8">
                                    <label className="block text-xs font-bold text-stone-700 mb-1">Minutes per day</label>
                                    <input type="number" min="1" max="1440" value={usageCapMinutes}
                                      onChange={(e) => setUsageCapMinutes(parseInt(e.target.value))}
                                      className="w-32 px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-sm" />
                                  </div>
                                )}
                                <button onClick={saveUsageCap} disabled={savingUsageCap}
                                  className="px-5 py-2 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50 text-sm">
                                  {savingUsageCap ? 'Saving...' : 'Save Usage Cap'}
                                </button>
                              </div>
                            )}

                            {!isPaid && (
                              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                                <p className="text-sm text-amber-800"><strong>Quiet Hours and Usage Cap</strong> are available on paid plans.</p>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                      );
                    })}
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
                  <h3 className="text-lg font-black text-stone-900 mb-4">Quick start (no tech skills needed)</h3>
                  <ol className="space-y-4">
                    {[
                      { n: '1', title: 'Plug it in', desc: 'Connect the Ring Ring Bridge to your router and power.' },
                      { n: '2', title: 'Connect your phone', desc: 'Plug your home phone into Phone 1 on the Bridge.' },
                      { n: '3', title: 'Register above', desc: 'Type a simple name and tap Register Device. We activate it, then your one-page setup opens right here.' },
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

            {/* Post-registration setup guide — only shown while pending activation */}
            {showSetupGuide && (() => {
              const newDevice = devices.find(d => d.id === showSetupGuide);
              if (!newDevice || newDevice.sip_username) return null;
              return (
                <div className="bg-green-50 rounded-3xl p-6 border-2 border-green-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-lg font-bold">✓</div>
                      <div>
                        <h3 className="font-black text-stone-900">{newDevice.name} registered!</h3>
                        <p className="text-sm text-stone-500">Your Ring Ring team will activate it shortly. The Setup Guide button will appear on the device once active.</p>
                      </div>
                    </div>
                    <button onClick={() => setShowSetupGuide(null)} className="text-stone-400 hover:text-stone-600 text-xl leading-none flex-shrink-0">×</button>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">

            {!selectedDevice && devices.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                <h2 className="text-lg font-black text-stone-900 mb-1">Which device?</h2>
                <p className="text-sm text-stone-500 mb-5">Select a device to manage its trusted contacts.</p>
                <div className="grid gap-3">
                  {devices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => { applySelectedDevice(device); void fetchFriendDevices(); }}
                      className="flex items-center gap-4 p-4 rounded-2xl border-2 border-stone-200 hover:border-[#C4531A] hover:bg-orange-50 transition text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                        device.status ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400'
                      }`}>
                        {device.status ? '✓' : '○'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-stone-900">{device.name}</p>
                        <p className="text-sm text-stone-500 truncate">
                          {device.phone_number
                            ? <span className="font-mono text-blue-600">{device.phone_number}</span>
                            : 'No line connected'
                          }
                          {' · '}{device.contacts?.length ?? 0} contacts
                        </p>
                      </div>
                      <span className="ml-auto text-stone-300 text-lg">›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDevice && (
              <>
                {/* Device Selector (switcher when already selected) */}
                {devices.length > 1 && (
                  <div className="bg-white rounded-3xl p-4 border-2 border-stone-100 flex items-center gap-3">
                    <span className="text-sm font-bold text-stone-500 shrink-0">Device:</span>
                    <select
                      value={selectedDevice.id}
                      onChange={(e) => {
                        const device = devices.find((d) => d.id === e.target.value);
                        if (device) applySelectedDevice(device);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none font-medium text-sm"
                    >
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

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

            {/* Account */}
            <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
              <h2 className="text-lg font-black text-stone-900 mb-5">Account</h2>
              <div className="space-y-6">
                {/* Email */}
                <div>
                  <p className="text-sm font-bold text-stone-700 mb-1">Current email</p>
                  <p className="text-sm text-stone-500 mb-3">{user.email}</p>
                  <label className="block text-sm font-bold text-stone-700 mb-2">New email address</label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900"
                      placeholder="new@email.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <button
                      onClick={updateEmail}
                      disabled={savingAccount || !newEmail.trim()}
                      className="px-5 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition disabled:opacity-50 text-sm"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-5">
                  <label className="block text-sm font-bold text-stone-700 mb-2">New password</label>
                  <div className="space-y-2">
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900"
                      placeholder="New password (min 8 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      onClick={updatePassword}
                      disabled={savingAccount || !newPassword || !confirmPassword}
                      className="px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition disabled:opacity-50 text-sm"
                    >
                      {savingAccount ? 'Saving…' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {accountMsg && (
                  <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                    accountMsg.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {accountMsg.text}
                  </div>
                )}
              </div>
            </div>

            {/* Security / 2FA */}
            <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
              <h2 className="text-lg font-black text-stone-900 mb-1">🔐 Two-Factor Authentication</h2>
              <p className="text-sm text-stone-500 mb-5">When enabled, you&apos;ll receive a 6-digit email code each time you sign in — adding an extra layer of protection.</p>
              <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-stone-100">
                <div>
                  <p className="font-bold text-stone-900">Email verification on sign-in</p>
                  <p className="text-sm text-stone-500">{profile?.two_factor_enabled ? 'Active — a code is emailed every login' : 'Not enabled'}</p>
                </div>
                <button
                  onClick={toggle2FA}
                  disabled={toggling2FA}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                    profile?.two_factor_enabled ? 'bg-[#C4531A]' : 'bg-stone-200'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    profile?.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Phone Lines Tab */}
        {activeTab === 'lines' && (
          <div className="space-y-6">

            {/* Free / Friends & Family tier */}
            {!isPaid ? (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-8 border-2 border-stone-100">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-2xl flex-shrink-0">👋</div>
                    <div>
                      <div className="text-xs font-black text-stone-400 uppercase tracking-widest mb-1">Ring Ring Free Plan</div>
                      <h2 className="text-2xl font-black text-stone-900 mb-2">Friends &amp; Family</h2>
                      <p className="text-stone-500 text-sm">You&apos;re on the free Ring Ring plan — you can call and receive calls from other Ring Ring users on the same network. No monthly charge, no phone number, no Stripe account.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-3xl p-6 border-2 border-amber-200">
                  <h3 className="font-black text-amber-900 mb-1">Want to call any US number?</h3>
                  <p className="text-sm text-amber-800 mb-4">Add a dedicated phone line for $8.95/month and unlock unlimited calls, Quiet Hours, Usage Caps, and real E911.</p>
                  <button onClick={() => router.push('/buy')} className="px-5 py-2.5 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition text-sm">
                    Upgrade for $8.95/month
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Active Lines */}
                <div className="bg-white rounded-3xl border-2 border-stone-100 overflow-hidden">
                  <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                    <h2 className="text-lg font-black text-stone-900">Active Lines</h2>
                    <button
                      onClick={() => { setActiveTab('store'); void fetchInvoices(); }}
                      className="text-sm font-bold text-[#C4531A] hover:underline"
                    >
                      + Add another line
                    </button>
                  </div>

                  {loadingSubscriptions ? (
                    <div className="p-12 text-center text-stone-400 text-sm">Loading…</div>
                  ) : subscriptions.length > 0 ? (
                    <div className="divide-y divide-stone-100">
                      {subscriptions.map((sub, i) => {
                        const isConfirming = confirmCancelId === sub.id;
                        const e911Open = e911LineOpen === sub.id;
                        const hasAddress = e911Street || e911City;
                        return (
                          <div key={sub.id} className="p-6 space-y-4">
                            {/* Line summary row */}
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-black text-stone-900">${(sub.amount / 100).toFixed(2)}/{sub.interval}</span>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    sub.cancelAtPeriodEnd ? 'bg-amber-100 text-amber-700'
                                    : sub.status === 'active' ? 'bg-green-100 text-green-700'
                                    : 'bg-stone-100 text-stone-500'
                                  }`}>
                                    {sub.cancelAtPeriodEnd ? 'Cancels at period end' : sub.status}
                                  </span>
                                </div>
                                {i === 0 && profile?.twilio_number && (
                                  <p className="font-mono text-sm font-bold text-blue-700 mb-1">{profile.twilio_number}</p>
                                )}
                                <p className="text-sm text-stone-500">
                                  {sub.cancelAtPeriodEnd ? 'Active until' : 'Renews'}{' '}
                                  {new Date(sub.currentPeriodEnd * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                              {!sub.cancelAtPeriodEnd && (
                                <button
                                  onClick={() => setConfirmCancelId(isConfirming ? null : sub.id)}
                                  className="shrink-0 px-4 py-2 text-red-600 hover:bg-red-50 font-bold rounded-xl transition text-sm"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>

                            {/* E911 per-line */}
                            <div className="border-t border-stone-100 pt-4">
                              <button
                                onClick={() => setE911LineOpen(e911Open ? null : sub.id)}
                                className="flex items-center justify-between w-full text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-stone-700">🚨 E911 Emergency Address</span>
                                  {!hasAddress && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Not set</span>}
                                </div>
                                <span className="text-stone-400 text-sm">{e911Open ? '⌃' : '⌄'}</span>
                              </button>
                              {!e911Open && hasAddress && (
                                <p className="text-xs text-stone-500 mt-1">
                                  {[e911Name, e911Street, e911City, e911State, e911Zip].filter(Boolean).join(', ')}
                                </p>
                              )}
                              {e911Open && (
                                <div className="mt-3 space-y-2">
                                  <input className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900 text-sm" placeholder="Caller name (e.g., Smith Family)" value={e911Name} onChange={(e) => setE911Name(e.target.value)} />
                                  <input className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900 text-sm" placeholder="Street address" value={e911Street} onChange={(e) => setE911Street(e.target.value)} />
                                  <div className="grid grid-cols-3 gap-2">
                                    <input className="col-span-1 px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900 text-sm" placeholder="City" value={e911City} onChange={(e) => setE911City(e.target.value)} />
                                    <input className="px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900 text-sm" placeholder="State" maxLength={2} value={e911State} onChange={(e) => setE911State(e.target.value.toUpperCase())} />
                                    <input className="px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900 text-sm" placeholder="ZIP" maxLength={10} value={e911Zip} onChange={(e) => setE911Zip(e.target.value)} />
                                  </div>
                                  <button onClick={saveE911} disabled={savingE911} className="px-5 py-2 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50 text-sm">
                                    {e911Saved ? '✓ Saved' : savingE911 ? 'Saving…' : 'Save E911 Address'}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Cancel confirmation */}
                            {isConfirming && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                                <p className="text-sm font-black text-red-800 mb-1">Are you sure you want to cancel this line?</p>
                                <p className="text-sm text-red-700 mb-4">Your number stays active until the end of the billing period. This cannot be undone.</p>
                                <div className="flex gap-3">
                                  <button onClick={() => void cancelSubscription(sub.id)} disabled={cancellingSubId === sub.id} className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition text-sm disabled:opacity-50">
                                    {cancellingSubId === sub.id ? 'Cancelling…' : 'Yes, cancel my line'}
                                  </button>
                                  <button onClick={() => setConfirmCancelId(null)} className="px-5 py-2 bg-white text-stone-700 font-bold rounded-xl border border-stone-200 hover:bg-stone-50 transition text-sm">
                                    Keep my line
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Paid but Stripe returned no subscriptions — profile fallback */
                    <div className="p-6 space-y-4">
                      {/* Line summary */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-stone-900">{profile?.plan === 'annual' ? '$85.80/year' : '$8.95/month'}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">active</span>
                          </div>
                          {profile?.twilio_number && (
                            <p className="font-mono text-sm font-bold text-blue-700 mb-1">{profile.twilio_number}</p>
                          )}
                          <p className="text-sm text-stone-500">{profile?.plan === 'annual' ? 'Annual plan' : 'Monthly plan'}</p>
                        </div>
                        {confirmCancelId !== 'direct' && (
                          <button onClick={() => setConfirmCancelId('direct')} className="shrink-0 px-4 py-2 text-red-600 hover:bg-red-50 font-bold rounded-xl transition text-sm">Cancel</button>
                        )}
                      </div>

                      {/* E911 per-line */}
                      {(() => {
                        const e911Open = e911LineOpen === 'direct';
                        const hasAddress = e911Street || e911City;
                        return (
                          <div className="border-t border-stone-100 pt-4">
                            <button onClick={() => setE911LineOpen(e911Open ? null : 'direct')} className="flex items-center justify-between w-full text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-stone-700">🚨 E911 Emergency Address</span>
                                {!hasAddress && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Not set</span>}
                              </div>
                              <span className="text-stone-400 text-sm">{e911Open ? '⌃' : '⌄'}</span>
                            </button>
                            {!e911Open && hasAddress && (
                              <p className="text-xs text-stone-500 mt-1">{[e911Name, e911Street, e911City, e911State, e911Zip].filter(Boolean).join(', ')}</p>
                            )}
                            {e911Open && (
                              <div className="mt-3 space-y-2">
                                <input className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900 text-sm" placeholder="Caller name (e.g., Smith Family)" value={e911Name} onChange={(e) => setE911Name(e.target.value)} />
                                <input className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900 text-sm" placeholder="Street address" value={e911Street} onChange={(e) => setE911Street(e.target.value)} />
                                <div className="grid grid-cols-3 gap-2">
                                  <input className="col-span-1 px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900 text-sm" placeholder="City" value={e911City} onChange={(e) => setE911City(e.target.value)} />
                                  <input className="px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900 text-sm" placeholder="State" maxLength={2} value={e911State} onChange={(e) => setE911State(e.target.value.toUpperCase())} />
                                  <input className="px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none text-stone-900 text-sm" placeholder="ZIP" maxLength={10} value={e911Zip} onChange={(e) => setE911Zip(e.target.value)} />
                                </div>
                                <button onClick={saveE911} disabled={savingE911} className="px-5 py-2 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50 text-sm">
                                  {e911Saved ? '✓ Saved' : savingE911 ? 'Saving…' : 'Save E911 Address'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Cancel confirmation */}
                      {confirmCancelId === 'direct' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                          <p className="text-sm font-black text-red-800 mb-1">Are you sure you want to cancel this line?</p>
                          <p className="text-sm text-red-700 mb-4">Your phone number will be released and your account will revert to the free plan. This cannot be undone.</p>
                          <div className="flex gap-3">
                            {profile?.stripe_subscription_id ? (
                              <button onClick={() => void cancelSubscription(profile.stripe_subscription_id!)} disabled={cancellingSubId === profile.stripe_subscription_id} className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition text-sm disabled:opacity-50">
                                {cancellingSubId === profile.stripe_subscription_id ? 'Cancelling…' : 'Yes, cancel my line'}
                              </button>
                            ) : (
                              <button onClick={() => void cancelNumber()} disabled={cancellingSubId === 'direct'} className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition text-sm disabled:opacity-50">
                                {cancellingSubId === 'direct' ? 'Cancelling…' : 'Yes, release my number'}
                              </button>
                            )}
                            <button onClick={() => setConfirmCancelId(null)} className="px-5 py-2 bg-white text-stone-700 font-bold rounded-xl border border-stone-200 hover:bg-stone-50 transition text-sm">Keep my line</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* What’s included */}
                <div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
                  <h3 className="font-black text-stone-900 mb-4">What&apos;s included on every line</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {['Dedicated phone number', 'Unlimited US calling', 'Trusted contact list', 'Quick dial keys', 'Quiet Hours scheduling', 'Digital Kill Switch', 'Daily usage caps', 'Real E911'].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                        <span className="text-stone-600">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

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
