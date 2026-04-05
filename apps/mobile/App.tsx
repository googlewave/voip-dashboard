import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { Session } from '@supabase/supabase-js';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createInvite,
  fetchBilling,
  fetchFriends,
  fetchHome,
  getApiConfigError,
  MobileApiError,
  openBillingPortal,
} from './src/lib/api';
import { getMobileConfigError, supabase } from './src/lib/supabase';
import {
  formatMoney,
  formatPhoneDisplay,
  formatPhoneInput,
  formatRelativePlan,
  getPhoneInputHint,
  isPhoneInputValid,
  normalizePhoneToE164,
} from './src/lib/phone';
import type { FriendsResponse, MobileBillingResponse, MobileContact, MobileDevice, MobileHomeResponse } from './src/types';

type AuthMode = 'signIn' | 'signUp';

type Tab = 'devices' | 'contacts' | 'friends' | 'lines' | 'settings';

type TestResult = {
  name: string;
  status: 'idle' | 'running' | 'ok' | 'error';
  latencyMs?: number;
  body?: unknown;
  error?: string;
};

type ContactDraft = {
  name: string;
  phone: string;
  type: 'phone_number' | 'ring_ring_friend';
  friendDeviceId: string;
};

type FriendDeviceOption = {
  id: string;
  name: string;
  sipUsername: string | null;
  friendshipId: string;
  friendEmail: string;
};

type ContactRecord = {
  id: string;
  device_id: string | null;
  name: string;
  phone_number: string | null;
  quick_dial_slot: number | null;
  contact_type: string | null;
  sip_username: string | null;
};

const TAB_ITEMS: Array<{ id: Tab; label: string; icon: ComponentProps<typeof Ionicons>['name'] }> = [
  { id: 'devices', label: 'Devices', icon: 'grid-outline' },
  { id: 'contacts', label: 'Contacts', icon: 'book-outline' },
  { id: 'friends', label: 'Friends', icon: 'people-outline' },
  { id: 'lines', label: 'Phone Lines', icon: 'call-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' },
];

function getContactDestination(contact: MobileContact) {
  if (contact.phoneNumber) {
    return formatPhoneDisplay(contact.phoneNumber);
  }

  if (contact.sipUsername) {
    return contact.contactType === 'ring_ring_friend' ? 'Ring Ring friend line' : contact.sipUsername;
  }

  return 'Private line';
}

function getContactTypeLabel(contact: MobileContact) {
  return contact.contactType === 'ring_ring_friend' ? 'Ring Ring friend' : 'Phone contact';
}

function getDeviceReadinessLabel(device: MobileDevice) {
  if (device.sipUsername || device.provisioningStatus === 'success') {
    return 'Line ready';
  }

  if (device.provisioningStatus === 'failed') {
    return 'Provisioning needs attention';
  }

  if (device.provisioningStatus === 'pending') {
    return 'Provisioning in progress';
  }

  return 'Provisioning still pending';
}

function mapContactRecord(record: ContactRecord): MobileContact {
  return {
    id: record.id,
    deviceId: record.device_id,
    name: record.name,
    phoneNumber: record.phone_number,
    quickDialSlot: record.quick_dial_slot,
    contactType: record.contact_type,
    sipUsername: record.sip_username,
  };
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, variant === 'secondary' ? styles.buttonSecondary : styles.buttonPrimary, disabled ? styles.buttonDisabled : null]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' ? styles.buttonTextSecondary : null]}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function DeviceCard({ device, expanded = false }: { device: MobileDevice; expanded?: boolean }) {
  const quickDialSlots = Array.from({ length: 9 }, (_, index) => {
    const slot = index + 1;

    return {
      slot,
      contact: device.contacts.find((contact) => contact.quickDialSlot === slot) ?? null,
    };
  });

  const assignedQuickDialCount = quickDialSlots.filter((entry) => entry.contact).length;

  return (
    <View style={styles.listCard}>
      <View style={styles.rowBetween}>
        <View style={styles.rowGapSmall}>
          <View style={[styles.statusDot, device.isOnline ? styles.statusOnline : styles.statusOffline]} />
          <Text style={styles.listTitle}>{device.name}</Text>
        </View>
        <Text style={styles.badge}>{device.adapterType || 'Adapter'}</Text>
      </View>

      <Text style={styles.listBody}>
        {device.phoneNumber ? formatPhoneDisplay(device.phoneNumber) : 'No assigned number yet'}
      </Text>
      <Text style={styles.mutedLine}>{getDeviceReadinessLabel(device)}</Text>
      <Text style={styles.mutedLine}>
        {device.contacts.length} saved contact{device.contacts.length === 1 ? '' : 's'}
      </Text>

      {expanded ? (
        <>
          <View style={styles.deviceSection}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionLabel}>Quick dial</Text>
              <Text style={styles.sectionMeta}>{assignedQuickDialCount}/9 assigned</Text>
            </View>

            <View style={styles.quickDialGrid}>
              {quickDialSlots.map(({ slot, contact }) => (
                <View key={slot} style={[styles.quickDialSlot, contact ? styles.quickDialSlotFilled : null]}>
                  <Text style={styles.quickDialNumber}>{slot}</Text>
                  <Text style={styles.quickDialName}>{contact?.name || 'Empty'}</Text>
                  <Text style={styles.quickDialValue}>{contact ? getContactDestination(contact) : 'Unassigned'}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.deviceSection}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionLabel}>Trusted contacts</Text>
              <Text style={styles.sectionMeta}>{device.contacts.length} total</Text>
            </View>

            {device.contacts.length > 0 ? (
              <View style={styles.contactList}>
                {device.contacts.map((contact) => (
                  <View key={contact.id} style={styles.contactCardRow}>
                    <View style={styles.contactPrimary}>
                      <View style={styles.rowGapSmall}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.smallBadge}>{getContactTypeLabel(contact)}</Text>
                      </View>
                      <Text style={styles.contactNumber}>{getContactDestination(contact)}</Text>
                    </View>
                    <Text style={styles.quickDialBadge}>
                      {contact.quickDialSlot ? `Key ${contact.quickDialSlot}` : 'Saved only'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noteText}>No trusted contacts are assigned to this line yet.</Text>
            )}
          </View>

          <Text style={styles.noteText}>Quick dial and trusted contact edits still happen in the full web dashboard.</Text>
        </>
      ) : device.contacts.length > 0 ? (
        <View style={styles.contactList}>
          {device.contacts.slice(0, 3).map((contact) => (
            <View key={contact.id} style={styles.contactRow}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactNumber}>
                {getContactDestination(contact)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function App() {
  const configError = getMobileConfigError() || getApiConfigError();

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('devices');
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<MobileHomeResponse | null>(null);
  const [friendsData, setFriendsData] = useState<FriendsResponse | null>(null);
  const [billingData, setBillingData] = useState<MobileBillingResponse | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [selectedContactsDeviceId, setSelectedContactsDeviceId] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState<ContactDraft>({
    name: '',
    phone: '',
    type: 'phone_number',
    friendDeviceId: '',
  });
  const [contactsBusy, setContactsBusy] = useState(false);
  const [selectedQuickDialContactId, setSelectedQuickDialContactId] = useState<string | null>(null);

  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'Supabase session', status: 'idle' },
    { name: 'GET /api/mobile/home', status: 'idle' },
    { name: 'GET /api/mobile/billing', status: 'idle' },
    { name: 'GET /api/friends', status: 'idle' },
  ]);
  const [testsBusy, setTestsBusy] = useState(false);

  const devices = homeData?.devices ?? [];
  const friendships = friendsData?.friendships ?? [];
  const friendDeviceOptions: FriendDeviceOption[] = friendships.flatMap((friendship) =>
    (friendship.friendDevices ?? []).map((device) => ({
      id: device.id,
      name: device.name,
      sipUsername: device.sip_username ?? null,
      friendshipId: friendship.id,
      friendEmail: friendship.friendEmail || '',
    }))
  );

  const selectedContactsDevice = devices.find((device) => device.id === selectedContactsDeviceId) ?? devices[0] ?? null;

  useEffect(() => {
    if (!devices.length) {
      setSelectedContactsDeviceId(null);
      return;
    }

    setSelectedContactsDeviceId((current) => {
      if (current && devices.some((device) => device.id === current)) {
        return current;
      }

      return devices[0].id;
    });
  }, [devices]);

  useEffect(() => {
    if (!selectedQuickDialContactId || !selectedContactsDevice) {
      return;
    }

    if (!selectedContactsDevice.contacts.some((contact) => contact.id === selectedQuickDialContactId)) {
      setSelectedQuickDialContactId(null);
    }
  }, [selectedContactsDevice, selectedQuickDialContactId]);

  async function loadAll(accessToken: string, asRefresh = false) {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoadingData(true);
    }

    setDataError(null);

    try {
      const [nextHome, nextFriends, nextBilling] = await Promise.all([
        fetchHome(accessToken),
        fetchFriends(accessToken),
        fetchBilling(accessToken),
      ]);

      setHomeData(nextHome);
      setFriendsData(nextFriends);
      setBillingData(nextBilling);
      setDataError(null);
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Unable to load your account.';

      if (error instanceof MobileApiError) {
        const source = error.path.replace('/api/', '').replace(/\//g, ' > ');
        message = `${source}${error.status ? ` (${error.status})` : ''}: ${error.message}`;
      }

      setDataError(message);
    } finally {
      setRefreshing(false);
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (!supabase || configError) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
      if (data.session?.access_token) {
        void loadAll(data.session.access_token);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.access_token) {
        void loadAll(nextSession.access_token);
      } else {
        setHomeData(null);
        setFriendsData(null);
        setBillingData(null);
        setActiveTab('devices');
      }
    });

    return () => subscription.unsubscribe();
  }, [configError]);

  async function handleAuth() {
    if (!supabase) {
      return;
    }

    setAuthBusy(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      if (authMode === 'signUp') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          throw error;
        }

        setAuthMessage('Check your email to confirm your account, then sign in here.');
        setAuthMode('signIn');
        setPassword('');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      setAuthError(message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleRefresh() {
    if (!session?.access_token) {
      return;
    }

    await loadAll(session.access_token, true);
  }

  async function handleCreateInvite() {
    if (!session?.access_token) {
      return;
    }

    setInviteBusy(true);
    try {
      const invite = await createInvite(session.access_token);
      await loadAll(session.access_token, true);
      await Share.share({
        message: `Join our Ring Ring Club connection: ${invite.inviteUrl}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create an invite right now.';
      Alert.alert('Invite failed', message);
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleOpenPortal() {
    if (!session?.access_token) {
      return;
    }

    setPortalBusy(true);
    try {
      const result = await openBillingPortal(session.access_token);
      await Linking.openURL(result.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open billing portal.';
      Alert.alert('Billing unavailable', message);
    } finally {
      setPortalBusy(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  }

  async function refreshMobileData() {
    if (!session?.access_token) {
      return;
    }

    await loadAll(session.access_token, true);
  }

  function updateDeviceContacts(deviceId: string, updater: (contacts: MobileContact[]) => MobileContact[]) {
    setHomeData((current) => {
      if (!current) {
        return current;
      }

      const nextDevices = current.devices.map((device) => {
        if (device.id !== deviceId) {
          return device;
        }

        return {
          ...device,
          contacts: updater(device.contacts),
        };
      });

      return {
        ...current,
        devices: nextDevices,
        summary: {
          ...current.summary,
          contactCount: nextDevices.reduce((count, device) => count + device.contacts.length, 0),
        },
      };
    });
  }

  async function handleAddContact() {
    if (!supabase || !selectedContactsDevice || !session?.user.id) {
      return;
    }

    if (!contactDraft.name.trim()) {
      Alert.alert('Missing name', 'Add a contact name before saving.');
      return;
    }

    const friendDevice = friendDeviceOptions.find((device) => device.id === contactDraft.friendDeviceId) ?? null;
    const normalizedPhone = contactDraft.type === 'phone_number' ? normalizePhoneToE164(contactDraft.phone) : null;

    if (contactDraft.type === 'phone_number' && !normalizedPhone) {
      Alert.alert('Invalid number', 'Enter a valid phone number before saving.');
      return;
    }

    if (contactDraft.type === 'ring_ring_friend' && !friendDevice) {
      Alert.alert('Select a friend device', 'Choose a connected Ring Ring device for this contact.');
      return;
    }

    setContactsBusy(true);

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        device_id: selectedContactsDevice.id,
        user_id: session.user.id,
        name: contactDraft.name.trim(),
        contact_type: contactDraft.type,
        phone_number: normalizedPhone,
        sip_username: contactDraft.type === 'ring_ring_friend' ? friendDevice?.sipUsername ?? null : null,
        friend_device_id: contactDraft.type === 'ring_ring_friend' ? friendDevice?.id ?? null : null,
        friendship_id: contactDraft.type === 'ring_ring_friend' ? friendDevice?.friendshipId ?? null : null,
        quick_dial_slot: null,
      })
      .select('id, device_id, name, phone_number, quick_dial_slot, contact_type, sip_username')
      .single<ContactRecord>();

    setContactsBusy(false);

    if (error) {
      Alert.alert('Could not add contact', error.message);
      return;
    }

    setContactDraft({ name: '', phone: '', type: 'phone_number', friendDeviceId: '' });
    setDataError(null);

    if (data) {
      updateDeviceContacts(selectedContactsDevice.id, (contacts) => [...contacts, mapContactRecord(data)]);
    }
  }

  async function handleDeleteContact(contactId: string) {
    if (!supabase) {
      return;
    }

    setContactsBusy(true);
    const { error } = await supabase.from('contacts').delete().eq('id', contactId);
    setContactsBusy(false);

    if (error) {
      Alert.alert('Could not remove contact', error.message);
      return;
    }

    if (selectedQuickDialContactId === contactId) {
      setSelectedQuickDialContactId(null);
    }

    setDataError(null);
    updateDeviceContacts(selectedContactsDevice?.id ?? '', (contacts) => contacts.filter((contact) => contact.id !== contactId));
  }

  async function assignQuickDial(contactId: string, slot: number | null) {
    if (!supabase || !selectedContactsDevice) {
      return;
    }

    setContactsBusy(true);

    if (slot !== null) {
      const displacedContact = selectedContactsDevice.contacts.find(
        (contact) => contact.quickDialSlot === slot && contact.id !== contactId
      );

      if (displacedContact) {
        const { error: clearError } = await supabase.from('contacts').update({ quick_dial_slot: null }).eq('id', displacedContact.id);

        if (clearError) {
          setContactsBusy(false);
          Alert.alert('Could not update quick dial', clearError.message);
          return;
        }
      }
    }

    const { error } = await supabase.from('contacts').update({ quick_dial_slot: slot }).eq('id', contactId);
    setContactsBusy(false);

    if (error) {
      Alert.alert('Could not update quick dial', error.message);
      return;
    }

    setSelectedQuickDialContactId(null);
    setDataError(null);
    updateDeviceContacts(selectedContactsDevice.id, (contacts) =>
      contacts.map((contact) => {
        if (slot !== null && contact.quickDialSlot === slot && contact.id !== contactId) {
          return { ...contact, quickDialSlot: null };
        }

        if (contact.id === contactId) {
          return { ...contact, quickDialSlot: slot };
        }

        return contact;
      })
    );
  }

  async function handleQuickDialSlotPress(slot: number) {
    if (!selectedQuickDialContactId) {
      return;
    }

    await assignQuickDial(selectedQuickDialContactId, slot);
  }

  async function runTests() {
    if (!session?.access_token) {
      return;
    }

    setTestsBusy(true);
    const token = session.access_token;
    const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

    const tests: { name: string; run: () => Promise<unknown> }[] = [
      {
        name: 'Supabase session',
        run: async () => {
          if (!supabase) throw new Error('Supabase client not initialised');
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          return {
            userId: data.session?.user.id,
            email: data.session?.user.email,
            expiresAt: data.session?.expires_at
              ? new Date(data.session.expires_at * 1000).toISOString()
              : null,
          };
        },
      },
      {
        name: 'GET /api/mobile/home',
        run: async () => {
          const res = await fetch(`${apiBase}/api/mobile/home`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const body = await res.json().catch(() => null);
          if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
          return body;
        },
      },
      {
        name: 'GET /api/mobile/billing',
        run: async () => {
          const res = await fetch(`${apiBase}/api/mobile/billing`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const body = await res.json().catch(() => null);
          if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
          return body;
        },
      },
      {
        name: 'GET /api/friends',
        run: async () => {
          const res = await fetch(`${apiBase}/api/friends`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const body = await res.json().catch(() => null);
          if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
          return body;
        },
      },
    ];

    // Reset all to running
    setTestResults(tests.map((t) => ({ name: t.name, status: 'running' })));

    const results: TestResult[] = await Promise.all(
      tests.map(async (t) => {
        const start = Date.now();
        try {
          const body = await t.run();
          return { name: t.name, status: 'ok' as const, latencyMs: Date.now() - start, body };
        } catch (err) {
          return {
            name: t.name,
            status: 'error' as const,
            latencyMs: Date.now() - start,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      })
    );

    setTestResults(results);
    setTestsBusy(false);
  }

  if (configError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.centeredPage}>
          <Text style={styles.heroKicker}>Ring Ring Club Mobile</Text>
          <Text style={styles.heroTitle}>Native apps are scaffolded.</Text>
          <Text style={styles.heroBody}>{configError}</Text>
          <Text style={styles.noteText}>Set the values in apps/mobile/.env, then run Expo again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.centeredPage}>
          <ActivityIndicator size="large" color="#c4531a" />
          <Text style={styles.loadingText}>Restoring your session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.authPage}>
          <Text style={styles.heroKicker}>Ring Ring Club</Text>
          <Text style={styles.heroTitle}>iOS and Android companion app</Text>
          <Text style={styles.heroBody}>
            Parents can sign in, review devices, manage family connections, and keep an eye on billing from a native app.
          </Text>

          <View style={styles.authToggle}>
            <Pressable
              onPress={() => {
                setAuthMode('signIn');
                setAuthError(null);
                setAuthMessage(null);
              }}
              style={[styles.authToggleButton, authMode === 'signIn' ? styles.authToggleButtonActive : null]}
            >
              <Text style={[styles.authToggleText, authMode === 'signIn' ? styles.authToggleTextActive : null]}>Sign in</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setAuthMode('signUp');
                setAuthError(null);
                setAuthMessage(null);
              }}
              style={[styles.authToggleButton, authMode === 'signUp' ? styles.authToggleButtonActive : null]}
            >
              <Text style={[styles.authToggleText, authMode === 'signUp' ? styles.authToggleTextActive : null]}>Create account</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#948779"
              style={styles.input}
              value={email}
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete={authMode === 'signUp' ? 'new-password' : 'password'}
              onChangeText={setPassword}
              placeholder={authMode === 'signUp' ? 'Choose a strong password' : 'Enter your password'}
              placeholderTextColor="#948779"
              secureTextEntry
              style={styles.input}
              value={password}
            />

            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
            {authMessage ? <Text style={styles.successText}>{authMessage}</Text> : null}

            <ActionButton
              label={authBusy ? 'Working...' : authMode === 'signIn' ? 'Sign in' : 'Create account'}
              onPress={() => void handleAuth()}
              disabled={authBusy || !email || !password}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const summary = homeData?.summary;
  const profile = homeData?.profile;
  const invites = friendsData?.sentInvites ?? [];
  const subscriptions = billingData?.subscriptions ?? [];
  const invoices = billingData?.invoices ?? [];
  const selectedContacts = selectedContactsDevice?.contacts ?? [];
  const selectedQuickDialContact = selectedContacts.find((contact) => contact.id === selectedQuickDialContactId) ?? null;
  const selectedQuickDialSlots = Array.from({ length: 9 }, (_, index) => {
    const slot = index + 1;

    return {
      slot,
      contact: selectedContacts.find((contact) => contact.quickDialSlot === slot) ?? null,
    };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>Ring Ring Club</Text>
              <View style={styles.portalBadge}>
                <Text style={styles.portalBadgeText}>Parent Portal</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>Hello, {session.user.email || 'parent'}.</Text>
          </View>
          <Pressable onPress={() => void handleRefresh()} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>{refreshing ? 'Refreshing...' : 'Refresh'}</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor="#c4531a" />}
        >
          {loadingData && !homeData ? (
            <View style={styles.centeredContent}>
              <ActivityIndicator size="large" color="#c4531a" />
              <Text style={styles.loadingText}>Loading your account...</Text>
            </View>
          ) : null}

          {dataError ? (
            <SectionCard title="Sync issue" subtitle="The app could not refresh your account.">
              <Text style={styles.errorText}>{dataError}</Text>
            </SectionCard>
          ) : null}

          {activeTab === 'devices' && homeData ? (
            <>
              <SectionCard title="Devices" subtitle="A snapshot of your Ring Ring Club hardware and line status.">
                <View style={styles.statsGrid}>
                  <StatTile label="Devices" value={summary?.deviceCount ?? 0} />
                  <StatTile label="Saved contacts" value={summary?.contactCount ?? 0} />
                  <StatTile label="Connected families" value={summary?.connectedFamilyCount ?? 0} />
                  <StatTile label="Active lines" value={summary?.activeLineCount ?? 0} />
                </View>
              </SectionCard>

              <SectionCard title="Plan" subtitle="Current account status from your web billing profile.">
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>Subscription</Text>
                  <Text style={styles.valueText}>{formatRelativePlan(profile?.plan || 'free')}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>Phone number</Text>
                  <Text style={styles.valueText}>{profile?.twilioNumber ? formatPhoneDisplay(profile.twilioNumber) : 'None assigned'}</Text>
                </View>
              </SectionCard>

              <SectionCard title="Calling features" subtitle="Per-device contacts and one-touch keys live under Devices.">
                <View style={styles.statsGrid}>
                  <StatTile label="Trusted contacts" value={summary?.contactCount ?? 0} />
                  <StatTile label="Quick dial keys" value={devices.reduce((count, device) => count + device.contacts.filter((contact) => contact.quickDialSlot !== null).length, 0)} />
                </View>
                <Text style={styles.noteText}>Open Contacts to add trusted contacts and assign quick-dial keys for each line.</Text>
              </SectionCard>

              <SectionCard title="Recent devices" subtitle="Your latest configured lines.">
                {devices.length > 0 ? devices.slice(0, 2).map((device) => <DeviceCard key={device.id} device={device} />) : <EmptyState title="No devices yet" body="Add a line from the web dashboard, then it will appear here." />}
              </SectionCard>
            </>
          ) : null}

          {activeTab === 'contacts' ? (
            devices.length > 0 ? (
              <>
                <SectionCard title="Contacts" subtitle="Manage a device’s safe list and assign its quick-dial keys.">
                  <Text style={styles.noteText}>Choose a device, add trusted contacts, then tap a contact and tap a key to assign it.</Text>
                  <View style={styles.devicePickerRow}>
                    {devices.map((device) => (
                      <Pressable
                        key={device.id}
                        onPress={() => setSelectedContactsDeviceId(device.id)}
                        style={[styles.devicePickerChip, selectedContactsDevice?.id === device.id ? styles.devicePickerChipActive : null]}
                      >
                        <Text style={[styles.devicePickerText, selectedContactsDevice?.id === device.id ? styles.devicePickerTextActive : null]}>
                          {device.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </SectionCard>

                {selectedContactsDevice ? (
                  <>
                    <SectionCard title="Add trusted contact" subtitle={`Safe-list entries for ${selectedContactsDevice.name}.`}>
                      <View style={styles.toggleRow}>
                        <Pressable
                          onPress={() => setContactDraft((current) => ({ ...current, type: 'phone_number', friendDeviceId: '' }))}
                          style={[styles.toggleChip, contactDraft.type === 'phone_number' ? styles.toggleChipActive : null]}
                        >
                          <Text style={[styles.toggleChipText, contactDraft.type === 'phone_number' ? styles.toggleChipTextActive : null]}>
                            Phone number
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setContactDraft((current) => ({ ...current, type: 'ring_ring_friend' }))}
                          style={[styles.toggleChip, contactDraft.type === 'ring_ring_friend' ? styles.toggleChipActive : null]}
                        >
                          <Text style={[styles.toggleChipText, contactDraft.type === 'ring_ring_friend' ? styles.toggleChipTextActive : null]}>
                            Ring Ring friend
                          </Text>
                        </Pressable>
                      </View>

                      <TextInput
                        onChangeText={(value) => setContactDraft((current) => ({ ...current, name: value }))}
                        placeholder="Contact name"
                        placeholderTextColor="#948779"
                        style={styles.input}
                        value={contactDraft.name}
                      />

                      {contactDraft.type === 'phone_number' ? (
                        <>
                          <TextInput
                            keyboardType="phone-pad"
                            onChangeText={(value) => setContactDraft((current) => ({ ...current, phone: formatPhoneInput(value) }))}
                            placeholder="(555) 010-1234"
                            placeholderTextColor="#948779"
                            style={[styles.input, !isPhoneInputValid(contactDraft.phone) ? styles.inputError : null]}
                            value={contactDraft.phone}
                          />
                          <Text style={[styles.helperText, !isPhoneInputValid(contactDraft.phone) ? styles.helperTextError : null]}>
                            {getPhoneInputHint(contactDraft.phone, 'Type a number and we will format it for you.')}
                          </Text>
                        </>
                      ) : friendDeviceOptions.length > 0 ? (
                        <View style={styles.friendDeviceList}>
                          {friendDeviceOptions.map((device) => (
                            <Pressable
                              key={device.id}
                              onPress={() => setContactDraft((current) => ({ ...current, friendDeviceId: device.id }))}
                              style={[styles.friendDeviceCard, contactDraft.friendDeviceId === device.id ? styles.friendDeviceCardActive : null]}
                            >
                              <Text style={styles.friendDeviceName}>{device.name}</Text>
                              <Text style={styles.friendDeviceMeta}>{device.friendEmail || 'Connected family'}</Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.noteText}>No connected family devices are available yet. Use the Friends tab to connect another family first.</Text>
                      )}

                      <ActionButton
                        label={contactsBusy ? 'Saving contact...' : 'Add to trusted contacts'}
                        onPress={() => void handleAddContact()}
                        disabled={
                          contactsBusy ||
                          !contactDraft.name.trim() ||
                          (contactDraft.type === 'phone_number' ? !normalizePhoneToE164(contactDraft.phone) : !contactDraft.friendDeviceId)
                        }
                      />
                    </SectionCard>

                    <SectionCard title="Trusted contacts" subtitle="Tap a contact to stage it for quick-dial assignment.">
                      {selectedContacts.length > 0 ? (
                        <View style={styles.editorList}>
                          {selectedContacts.map((contact) => (
                            <View key={contact.id} style={[styles.contactEditorRow, selectedQuickDialContactId === contact.id ? styles.contactEditorRowActive : null]}>
                              <Pressable style={styles.contactEditorMain} onPress={() => setSelectedQuickDialContactId((current) => current === contact.id ? null : contact.id)}>
                                <View style={styles.rowBetween}>
                                  <View style={styles.contactPrimary}>
                                    <View style={styles.rowGapSmall}>
                                      <Text style={styles.contactName}>{contact.name}</Text>
                                      <Text style={styles.smallBadge}>{getContactTypeLabel(contact)}</Text>
                                    </View>
                                    <Text style={styles.contactNumber}>{getContactDestination(contact)}</Text>
                                  </View>
                                  <Text style={styles.quickDialBadge}>{contact.quickDialSlot ? `Key ${contact.quickDialSlot}` : 'Tap to assign'}</Text>
                                </View>
                              </Pressable>
                              <View style={styles.contactActionRow}>
                                {contact.quickDialSlot ? (
                                  <Pressable onPress={() => void assignQuickDial(contact.id, null)} style={styles.inlineActionButton}>
                                    <Text style={styles.inlineActionText}>Clear key</Text>
                                  </Pressable>
                                ) : null}
                                <Pressable onPress={() => void handleDeleteContact(contact.id)} style={[styles.inlineActionButton, styles.inlineDangerButton]}>
                                  <Text style={[styles.inlineActionText, styles.inlineDangerText]}>Delete</Text>
                                </Pressable>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <EmptyState title="No trusted contacts yet" body="Add a phone number or a Ring Ring friend above, then assign it to a quick-dial key if needed." />
                      )}
                    </SectionCard>

                    <SectionCard title="Quick dial" subtitle="Tap a contact above, then tap a slot below to assign it.">
                      <Text style={styles.noteText}>
                        {selectedQuickDialContact ? `Selected: ${selectedQuickDialContact.name}. Tap any key 1-9 to assign.` : 'Choose a trusted contact first. Drag-and-drop is replaced here with tap-to-assign so it works on phones and in the web preview.'}
                      </Text>
                      <View style={styles.quickDialGrid}>
                        {selectedQuickDialSlots.map(({ slot, contact }) => (
                          <Pressable
                            key={slot}
                            onPress={() => void handleQuickDialSlotPress(slot)}
                            disabled={!selectedQuickDialContactId || contactsBusy}
                            style={[
                              styles.quickDialSlot,
                              contact ? styles.quickDialSlotFilled : null,
                              selectedQuickDialContactId ? styles.quickDialSlotSelectable : null,
                            ]}
                          >
                            <Text style={styles.quickDialNumber}>{slot}</Text>
                            <Text style={styles.quickDialName}>{contact?.name || 'Empty'}</Text>
                            <Text style={styles.quickDialValue}>{contact ? getContactDestination(contact) : selectedQuickDialContactId ? 'Tap to assign' : 'Unassigned'}</Text>
                            {contact ? (
                              <Pressable onPress={() => void assignQuickDial(contact.id, null)} style={styles.clearKeyButton}>
                                <Text style={styles.clearKeyButtonText}>Clear</Text>
                              </Pressable>
                            ) : null}
                          </Pressable>
                        ))}
                      </View>
                    </SectionCard>
                  </>
                ) : null}
              </>
            ) : (
              <SectionCard title="Contacts" subtitle="Manage a device’s safe list and assign its quick-dial keys.">
                <EmptyState title="No devices yet" body="Your native app is connected, but there are no devices on this account yet." />
              </SectionCard>
            )
          ) : null}

          {activeTab === 'friends' ? (
            <>
              <SectionCard title="Friends" subtitle="Create a parent-approved invite link and keep track of connected families.">
                <ActionButton label={inviteBusy ? 'Creating invite...' : 'Create invite link'} onPress={() => void handleCreateInvite()} disabled={inviteBusy} />
                <Text style={styles.noteText}>The mobile app shares the same invite and approval system as the web dashboard.</Text>
              </SectionCard>

              <SectionCard title="Pending invites" subtitle="Invites stay active for seven days.">
                {invites.length > 0 ? invites.map((invite) => (
                  <View key={invite.id} style={styles.listRow}>
                    <Text style={styles.listTitle}>Invite sent</Text>
                    <Text style={styles.listBody}>{new Date(invite.expires_at).toLocaleDateString()}</Text>
                  </View>
                )) : <EmptyState title="Nothing pending" body="Create an invite when you are ready to connect with another family." />}
              </SectionCard>

              <SectionCard title="Connected families" subtitle="Shared devices your family is allowed to call.">
                {friendships.length > 0 ? friendships.map((friendship) => (
                  <View key={friendship.id} style={styles.listCard}>
                    <Text style={styles.listTitle}>{friendship.friendEmail || 'Connected family'}</Text>
                    <Text style={styles.listBody}>{friendship.friendDevices?.length || 0} shared device{friendship.friendDevices?.length === 1 ? '' : 's'}</Text>
                    {(friendship.friendDevices || []).map((device) => (
                      <View key={device.id} style={styles.contactRow}>
                        <Text style={styles.contactName}>{device.name}</Text>
                        <Text style={styles.contactNumber}>{device.sip_username ? 'Ready' : 'Provisioning'}</Text>
                      </View>
                    ))}
                  </View>
                )) : <EmptyState title="No connected families" body="Once another parent accepts an invite, their shared devices will show up here." />}
              </SectionCard>
            </>
          ) : null}

          {activeTab === 'lines' ? (
            <>
              <SectionCard title="Phone lines" subtitle="Subscription details, billing access, and line information.">
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>Current plan</Text>
                  <Text style={styles.valueText}>{formatRelativePlan(billingData?.plan || 'free')}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>Assigned number</Text>
                  <Text style={styles.valueText}>{billingData?.phoneNumber ? formatPhoneDisplay(billingData.phoneNumber) : 'None assigned'}</Text>
                </View>
                <ActionButton label={portalBusy ? 'Opening...' : 'Open billing portal'} onPress={() => void handleOpenPortal()} variant="secondary" disabled={portalBusy} />
                <Text style={styles.noteText}>Adding another line and payment changes still use Stripe’s secure browser flow.</Text>
              </SectionCard>

              <SectionCard title="Active lines" subtitle="Active and scheduled Stripe subscriptions.">
                {subscriptions.length > 0 ? subscriptions.map((subscription) => (
                  <View key={subscription.id} style={styles.listCard}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.listTitle}>{subscription.interval === 'year' ? 'Annual plan' : 'Monthly plan'}</Text>
                      <Text style={styles.badge}>{subscription.status}</Text>
                    </View>
                    <Text style={styles.listBody}>{formatMoney(subscription.amount, subscription.currency)}</Text>
                    <Text style={styles.mutedLine}>Renews {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}</Text>
                    {subscription.cancelAtPeriodEnd ? <Text style={styles.warningText}>Cancels at period end</Text> : null}
                  </View>
                )) : <EmptyState title="No subscriptions" body="This account does not have a paid Stripe subscription yet." />}
              </SectionCard>

              <SectionCard title="Order history" subtitle="Recent receipts from Stripe.">
                {invoices.length > 0 ? invoices.map((invoice) => (
                  <Pressable
                    key={invoice.id}
                    onPress={() => invoice.pdf ? void Linking.openURL(invoice.pdf) : undefined}
                    style={styles.listCard}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={styles.listTitle}>{invoice.description}</Text>
                      <Text style={styles.valueText}>{formatMoney(invoice.amount, invoice.currency)}</Text>
                    </View>
                    <Text style={styles.mutedLine}>{new Date(invoice.date * 1000).toLocaleDateString()}</Text>
                    <Text style={styles.mutedLine}>{invoice.status || 'Unknown status'}</Text>
                  </Pressable>
                )) : <EmptyState title="No orders yet" body="Receipts will appear here after the first successful charge." />}
              </SectionCard>
            </>
          ) : null}

          {activeTab === 'settings' ? (
            <>
              <SectionCard title="Settings" subtitle="Core identity, account security, and line defaults.">
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>Email</Text>
                  <Text style={styles.valueText}>{session.user.email || 'Unknown'}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>Plan</Text>
                  <Text style={styles.valueText}>{formatRelativePlan(profile?.plan || 'free')}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>Primary line</Text>
                  <Text style={styles.valueText}>{profile?.twilioNumber ? formatPhoneDisplay(profile.twilioNumber) : 'None assigned'}</Text>
                </View>
              </SectionCard>

              <SectionCard title="Security" subtitle="Authentication settings are managed in the parent dashboard.">
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>Two-factor auth</Text>
                  <Text style={styles.valueText}>{profile?.twoFactorEnabled ? 'Enabled' : 'Off'}</Text>
                </View>
                <Text style={styles.noteText}>Use the web app to turn 2FA on or off and complete recovery steps.</Text>
              </SectionCard>

              <SectionCard title="Emergency address" subtitle="Pulled from the same profile used by the web dashboard.">
                <Text style={styles.listBody}>{profile?.e911.name || 'No E911 profile saved yet'}</Text>
                <Text style={styles.mutedLine}>{profile?.e911.street || ''}</Text>
                <Text style={styles.mutedLine}>{[profile?.e911.city, profile?.e911.state, profile?.e911.zip].filter(Boolean).join(', ') || ''}</Text>
              </SectionCard>

              <SectionCard title="Web-only tools" subtitle="A few advanced flows still belong in the full dashboard.">
                <Text style={styles.noteText}>Device edits, provisioning tools, and admin actions remain in the web app for now.</Text>
                <ActionButton label="Sign out" onPress={() => void handleSignOut()} variant="secondary" />
              </SectionCard>

              <SectionCard title="Diagnostics" subtitle="Run mobile API checks without adding a separate top-level debug tab.">
                <ActionButton
                  label={testsBusy ? 'Running tests...' : 'Run all tests'}
                  onPress={() => void runTests()}
                  disabled={testsBusy}
                />
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>API base URL</Text>
                  <Text style={[styles.valueText, { fontSize: 11 }]}>
                    {process.env.EXPO_PUBLIC_API_BASE_URL ?? '(not set)'}
                  </Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>User</Text>
                  <Text style={styles.valueText}>{session.user.email}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.keyText}>Token</Text>
                  <Text style={[styles.valueText, { fontSize: 10 }]}>
                    {session.access_token.slice(0, 24)}…
                  </Text>
                </View>
              </SectionCard>

              {testResults.map((result) => (
                <View key={result.name} style={[styles.listCard, { borderLeftWidth: 4, borderLeftColor: result.status === 'ok' ? '#22c55e' : result.status === 'error' ? '#ef4444' : result.status === 'running' ? '#f59e0b' : '#d1d5db' }]}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.listTitle}>{result.name}</Text>
                    <Text style={[styles.badge, {
                      backgroundColor: result.status === 'ok' ? '#dcfce7' : result.status === 'error' ? '#fee2e2' : result.status === 'running' ? '#fef3c7' : '#f3f4f6',
                      color: result.status === 'ok' ? '#166534' : result.status === 'error' ? '#991b1b' : result.status === 'running' ? '#92400e' : '#6b7280',
                    }]}>
                      {result.status === 'running' ? '⏳' : result.status === 'ok' ? '✓ OK' : result.status === 'error' ? '✗ FAIL' : 'idle'}
                    </Text>
                  </View>

                  {result.latencyMs !== undefined ? (
                    <Text style={styles.mutedLine}>{result.latencyMs}ms</Text>
                  ) : null}

                  {result.error ? (
                    <Text style={[styles.errorText, { marginTop: 4 }]}>{result.error}</Text>
                  ) : null}

                  {result.status === 'ok' && result.body ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 8 }}>
                      <Text style={styles.codeBlock}>
                        {JSON.stringify(result.body, null, 2).slice(0, 1200)}
                        {JSON.stringify(result.body, null, 2).length > 1200 ? '\n… (truncated)' : ''}
                      </Text>
                    </ScrollView>
                  ) : null}
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>

        <View style={styles.bottomTabBar}>
          {TAB_ITEMS.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={styles.bottomTabButton}
              >
                <View style={[styles.bottomTabIconWrap, active ? styles.bottomTabIconWrapActive : null]}>
                  <Ionicons
                    name={active ? tab.icon.replace('-outline', '') as ComponentProps<typeof Ionicons>['name'] : tab.icon}
                    size={20}
                    color={active ? '#c4531a' : '#7b6d60'}
                  />
                </View>
                <Text style={[styles.bottomTabLabel, active ? styles.bottomTabLabelActive : null]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf7f2',
  },
  page: {
    flex: 1,
    backgroundColor: '#faf7f2',
  },
  centeredPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  centeredContent: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  authPage: {
    padding: 24,
    gap: 18,
  },
  heroKicker: {
    color: '#c4531a',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#29211b',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
  },
  heroBody: {
    color: '#5b5046',
    fontSize: 16,
    lineHeight: 24,
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: '#f4e8db',
    borderRadius: 18,
    padding: 4,
  },
  authToggleButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  authToggleButtonActive: {
    backgroundColor: '#ffffff',
  },
  authToggleText: {
    color: '#7b6d60',
    fontWeight: '700',
  },
  authToggleTextActive: {
    color: '#29211b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#efe4d7',
    gap: 12,
  },
  cardTitle: {
    color: '#29211b',
    fontSize: 20,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: '#6c6157',
    fontSize: 14,
    lineHeight: 20,
  },
  cardBody: {
    gap: 12,
  },
  inputLabel: {
    color: '#5b5046',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6d7c6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#29211b',
    backgroundColor: '#fffdfa',
  },
  inputError: {
    borderColor: '#f0a5a5',
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#c4531a',
  },
  buttonSecondary: {
    backgroundColor: '#f8efe6',
    borderWidth: 1,
    borderColor: '#e6d7c6',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonTextSecondary: {
    color: '#5b5046',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandTitle: {
    color: '#29211b',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  portalBadge: {
    borderRadius: 999,
    backgroundColor: '#e9f6ff',
    borderWidth: 1,
    borderColor: '#b9dff5',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  portalBadgeText: {
    color: '#24567a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#29211b',
    fontSize: 16,
    fontWeight: '700',
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fffdfa',
    borderWidth: 1,
    borderColor: '#e6d7c6',
    borderRadius: 999,
  },
  refreshButtonText: {
    color: '#5b5046',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#ead8c6',
    backgroundColor: '#fffdfa',
  },
  bottomTabButton: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  bottomTabIconWrap: {
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  bottomTabIconWrapActive: {
    backgroundColor: '#fff1e8',
  },
  bottomTabLabel: {
    color: '#7b6d60',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
  bottomTabLabelActive: {
    color: '#c4531a',
  },
  devicePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  devicePickerChip: {
    borderRadius: 999,
    backgroundColor: '#fff7ef',
    borderWidth: 1,
    borderColor: '#ead8c6',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  devicePickerChipActive: {
    backgroundColor: '#c4531a',
    borderColor: '#c4531a',
  },
  devicePickerText: {
    color: '#6c6157',
    fontSize: 13,
    fontWeight: '700',
  },
  devicePickerTextActive: {
    color: '#ffffff',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e6d7c6',
    backgroundColor: '#fff7ef',
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleChipActive: {
    backgroundColor: '#c4531a',
    borderColor: '#c4531a',
  },
  toggleChipText: {
    color: '#5b5046',
    fontSize: 13,
    fontWeight: '800',
  },
  toggleChipTextActive: {
    color: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statTile: {
    width: '47%',
    minHeight: 90,
    borderRadius: 20,
    backgroundColor: '#fff7ef',
    padding: 16,
    justifyContent: 'space-between',
  },
  statValue: {
    color: '#29211b',
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    color: '#6c6157',
    fontSize: 13,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowGapSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyText: {
    color: '#6c6157',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  valueText: {
    color: '#29211b',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
  listCard: {
    gap: 8,
    borderRadius: 18,
    backgroundColor: '#fffaf4',
    padding: 16,
    borderWidth: 1,
    borderColor: '#efe4d7',
  },
  listRow: {
    borderRadius: 16,
    backgroundColor: '#fffaf4',
    padding: 16,
    gap: 4,
  },
  listTitle: {
    color: '#29211b',
    fontSize: 16,
    fontWeight: '800',
  },
  listBody: {
    color: '#4d433a',
    fontSize: 14,
    lineHeight: 20,
  },
  mutedLine: {
    color: '#7b6d60',
    fontSize: 13,
    lineHeight: 18,
  },
  noteText: {
    color: '#7b6d60',
    fontSize: 13,
    lineHeight: 19,
  },
  helperText: {
    color: '#7b6d60',
    fontSize: 12,
    lineHeight: 18,
  },
  helperTextError: {
    color: '#b42318',
  },
  badge: {
    color: '#8b5a2b',
    backgroundColor: '#f8e9d7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  statusOnline: {
    backgroundColor: '#2f9e67',
  },
  statusOffline: {
    backgroundColor: '#c5b8aa',
  },
  contactList: {
    gap: 8,
    marginTop: 4,
  },
  editorList: {
    gap: 10,
  },
  deviceSection: {
    gap: 10,
    marginTop: 8,
  },
  sectionLabel: {
    color: '#29211b',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionMeta: {
    color: '#7b6d60',
    fontSize: 12,
    fontWeight: '700',
  },
  quickDialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickDialSlot: {
    width: '31%',
    minHeight: 92,
    borderRadius: 16,
    padding: 10,
    backgroundColor: '#f8efe6',
    borderWidth: 1,
    borderColor: '#ead8c6',
    gap: 4,
  },
  quickDialSlotFilled: {
    backgroundColor: '#fff7ef',
  },
  quickDialSlotSelectable: {
    borderColor: '#c4531a',
  },
  quickDialNumber: {
    color: '#c4531a',
    fontSize: 12,
    fontWeight: '900',
  },
  quickDialName: {
    color: '#29211b',
    fontSize: 13,
    fontWeight: '800',
  },
  quickDialValue: {
    color: '#6c6157',
    fontSize: 12,
    lineHeight: 16,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    backgroundColor: '#fffdfa',
    borderWidth: 1,
    borderColor: '#efe4d7',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  contactEditorRow: {
    borderRadius: 18,
    backgroundColor: '#fffaf4',
    borderWidth: 1,
    borderColor: '#efe4d7',
    padding: 12,
    gap: 10,
  },
  contactEditorRowActive: {
    borderColor: '#c4531a',
    backgroundColor: '#fff2e8',
  },
  contactEditorMain: {
    gap: 6,
  },
  contactPrimary: {
    flex: 1,
    gap: 4,
  },
  contactActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  inlineActionButton: {
    borderRadius: 999,
    backgroundColor: '#f4e8db',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inlineDangerButton: {
    backgroundColor: '#fff0f0',
  },
  inlineActionText: {
    color: '#5b5046',
    fontSize: 12,
    fontWeight: '800',
  },
  inlineDangerText: {
    color: '#b42318',
  },
  contactName: {
    color: '#4d433a',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  contactNumber: {
    color: '#7b6d60',
    fontSize: 13,
    flexShrink: 1,
    textAlign: 'right',
  },
  smallBadge: {
    color: '#8b5a2b',
    backgroundColor: '#f8e9d7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '700',
  },
  quickDialBadge: {
    color: '#5b5046',
    backgroundColor: '#f4e8db',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '800',
  },
  friendDeviceList: {
    gap: 8,
  },
  friendDeviceCard: {
    borderRadius: 14,
    backgroundColor: '#fff7ef',
    borderWidth: 1,
    borderColor: '#ead8c6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  friendDeviceCardActive: {
    borderColor: '#c4531a',
    backgroundColor: '#fff2e8',
  },
  friendDeviceName: {
    color: '#29211b',
    fontSize: 14,
    fontWeight: '800',
  },
  friendDeviceMeta: {
    color: '#7b6d60',
    fontSize: 12,
  },
  clearKeyButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#f4e8db',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearKeyButtonText: {
    color: '#5b5046',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyState: {
    paddingVertical: 18,
    gap: 6,
  },
  emptyTitle: {
    color: '#29211b',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyBody: {
    color: '#6c6157',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: '#157347',
    fontSize: 14,
    lineHeight: 20,
  },
  warningText: {
    color: '#9a6700',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingText: {
    color: '#5b5046',
    fontSize: 15,
    fontWeight: '600',
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 10,
    lineHeight: 16,
  },
});
