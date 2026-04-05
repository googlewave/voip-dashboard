import type {
  FriendsResponse,
  InviteCreateResponse,
  MobileBillingResponse,
  MobileHomeResponse,
} from '../types';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

export function getApiBaseUrl() {
  return apiBaseUrl ?? null;
}

export function getApiConfigError() {
  if (!apiBaseUrl) {
    return 'Missing EXPO_PUBLIC_API_BASE_URL in apps/mobile/.env.';
  }

  return null;
}

async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Request failed');
  }

  return payload as T;
}

export function fetchHome(accessToken: string) {
  return request<MobileHomeResponse>('/api/mobile/home', accessToken);
}

export function fetchBilling(accessToken: string) {
  return request<MobileBillingResponse>('/api/mobile/billing', accessToken);
}

export function fetchFriends(accessToken: string) {
  return request<FriendsResponse>('/api/friends', accessToken);
}

export function createInvite(accessToken: string) {
  return request<InviteCreateResponse>('/api/friends/invite/create', accessToken, {
    method: 'POST',
  });
}

export function openBillingPortal(accessToken: string) {
  return request<{ url: string }>('/api/mobile/billing/portal', accessToken, {
    method: 'POST',
  });
}
