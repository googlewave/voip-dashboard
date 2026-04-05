import type {
  FriendsResponse,
  InviteCreateResponse,
  MobileBillingResponse,
  MobileHomeResponse,
} from '../types';

export class MobileApiError extends Error {
  path: string;
  status: number;

  constructor(path: string, status: number, message: string) {
    super(message);
    this.name = 'MobileApiError';
    this.path = path;
    this.status = status;
  }
}

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

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new MobileApiError(path, 0, message);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new MobileApiError(path, response.status, payload?.error || `Request failed (${response.status})`);
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
