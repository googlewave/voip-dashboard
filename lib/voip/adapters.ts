export const ADAPTER_OPTIONS = [
  {
    value: 'grandstream-ht801',
    label: 'Grandstream HT801',
    provisioningQueryType: 'grandstream',
    provisioningFamily: 'grandstream',
  },
  {
    value: 'linksys-spa2102',
    label: 'Linksys SPA2102',
    provisioningQueryType: 'linksys',
    provisioningFamily: 'spa',
  },
  {
    value: 'linksys-spa1001',
    label: 'Linksys SPA1001',
    provisioningQueryType: 'linksys',
    provisioningFamily: 'spa',
  },
  {
    value: 'cisco-spa122',
    label: 'Cisco SPA122',
    provisioningQueryType: 'linksys',
    provisioningFamily: 'spa',
  },
] as const;

export type SupportedAdapterType = (typeof ADAPTER_OPTIONS)[number]['value'];
export type ProvisioningQueryType = (typeof ADAPTER_OPTIONS)[number]['provisioningQueryType'];
export type ProvisioningFamily = (typeof ADAPTER_OPTIONS)[number]['provisioningFamily'];

const LEGACY_ADAPTER_MAP: Record<string, SupportedAdapterType> = {
  grandstream: 'grandstream-ht801',
  'grandstream-ht801': 'grandstream-ht801',
  linksys: 'linksys-spa2102',
  'linksys-spa2102': 'linksys-spa2102',
  spa2102: 'linksys-spa2102',
  'linksys-spa1001': 'linksys-spa1001',
  spa1001: 'linksys-spa1001',
  'cisco-spa122': 'cisco-spa122',
  spa122: 'cisco-spa122',
};

export function normalizeAdapterType(value: string | null | undefined): SupportedAdapterType | null {
  if (!value) return null;
  return LEGACY_ADAPTER_MAP[value.toLowerCase()] ?? null;
}

export function getAdapterLabel(value: string | null | undefined): string {
  const normalized = normalizeAdapterType(value);
  if (!normalized) {
    return value || 'Unknown';
  }

  return ADAPTER_OPTIONS.find((option) => option.value === normalized)?.label ?? normalized;
}

export function getProvisioningQueryType(value: string | null | undefined): ProvisioningQueryType {
  const normalized = normalizeAdapterType(value);
  if (!normalized) return 'linksys';
  return ADAPTER_OPTIONS.find((option) => option.value === normalized)?.provisioningQueryType ?? 'linksys';
}

export function getProvisioningFamily(value: string | null | undefined): ProvisioningFamily {
  const normalized = normalizeAdapterType(value);
  if (!normalized) return 'spa';
  return ADAPTER_OPTIONS.find((option) => option.value === normalized)?.provisioningFamily ?? 'spa';
}

export function getDefaultAdapterType(): SupportedAdapterType {
  return 'grandstream-ht801';
}