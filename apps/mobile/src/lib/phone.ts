function extractDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function normalizePhoneToE164(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const digits = extractDigits(trimmed);
  if (!digits) {
    return null;
  }

  if (trimmed.startsWith('+')) {
    if (digits.length < 8 || digits.length > 15) {
      return null;
    }

    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return null;
}

export function formatPhoneInput(raw: string | null | undefined): string {
  if (!raw) {
    return '';
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const digits = extractDigits(trimmed);
  if (!digits) {
    return trimmed.startsWith('+') ? '+' : '';
  }

  if (trimmed.startsWith('+')) {
    if (digits.startsWith('1') && digits.length <= 11) {
      const national = digits.slice(1);

      if (!national) return '+1';
      if (national.length <= 3) return `+1 ${national}`;
      if (national.length <= 6) return `+1 ${national.slice(0, 3)} ${national.slice(3)}`;
      return `+1 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6, 10)}`;
    }

    return `+${digits}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  if (digits.length === 11 && digits.startsWith('1')) {
    return `1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  }

  return digits;
}

export function isPhoneInputValid(raw: string | null | undefined) {
  if (!raw?.trim()) {
    return true;
  }

  return normalizePhoneToE164(raw) !== null;
}

export function getPhoneInputHint(raw: string | null | undefined, emptyHint: string) {
  if (!raw?.trim()) {
    return emptyHint;
  }

  return normalizePhoneToE164(raw) ? 'Looks good.' : 'Enter a 10-digit number, like (555) 010-1234.';
}

export function formatPhoneDisplay(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const digits = extractDigits(value);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }

  if (value.startsWith('+') && digits) {
    return `+${digits}`;
  }

  return value;
}

export function formatMoney(amountInMinorUnits: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amountInMinorUnits / 100);
}

export function formatRelativePlan(plan: string) {
  if (plan === 'annual') {
    return 'Annual';
  }

  if (plan === 'monthly') {
    return 'Monthly';
  }

  return 'Free';
}
