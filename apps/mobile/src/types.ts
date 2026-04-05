export type MobileProfile = {
  id: string;
  email: string;
  plan: string;
  twilioNumber: string | null;
  areaCode: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  twoFactorEnabled: boolean;
  e911: {
    name: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
};

export type MobileContact = {
  id: string;
  deviceId: string | null;
  name: string;
  phoneNumber: string | null;
  quickDialSlot: number | null;
  contactType: string | null;
  sipUsername: string | null;
};

export type MobileDevice = {
  id: string;
  name: string;
  phoneNumber: string | null;
  isOnline: boolean;
  sipUsername: string | null;
  macAddress: string | null;
  adapterType: string | null;
  createdAt: string;
  quietHoursEnabled: boolean | null;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  usageCapEnabled: boolean;
  usageCapMinutes: number | null;
  provisioningStatus: string | null;
  contacts: MobileContact[];
};

export type MobileHomeResponse = {
  profile: MobileProfile;
  devices: MobileDevice[];
  summary: {
    deviceCount: number;
    contactCount: number;
    connectedFamilyCount: number;
    activeLineCount: number;
  };
};

export type FriendDevice = {
  id: string;
  name: string;
  status?: boolean;
  sip_username?: string | null;
};

export type Friendship = {
  id: string;
  friendEmail?: string;
  friendDevices?: FriendDevice[];
};

export type PendingInvite = {
  id: string;
  expires_at: string;
};

export type FriendsResponse = {
  friendships: Friendship[];
  sentInvites: PendingInvite[];
};

export type MobileSubscription = {
  id: string;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  interval: string;
};

export type MobileInvoice = {
  id: string;
  amount: number;
  currency: string;
  status: string | null;
  date: number;
  description: string;
  pdf: string | null;
};

export type MobileBillingResponse = {
  plan: string;
  phoneNumber: string | null;
  subscriptions: MobileSubscription[];
  invoices: MobileInvoice[];
};

export type InviteCreateResponse = {
  inviteToken: string;
  inviteUrl: string;
  expiresAt: string;
};
