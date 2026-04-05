const MIN_E164_DIGITS = 8;
const MAX_E164_DIGITS = 15;

function extractDigits(raw: string) {
  return raw.replace(/\D/g, '');
}

export function normalizePhoneToE164(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digits = extractDigits(trimmed);
  if (!digits) return null;

  if (trimmed.startsWith('+')) {
    if (digits.length < MIN_E164_DIGITS || digits.length > MAX_E164_DIGITS) {
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
  if (!raw) return '';

  const trimmed = raw.trim();
  if (!trimmed) return '';

  const digits = extractDigits(trimmed);
  if (!digits) return trimmed.startsWith('+') ? '+' : '';

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
  if (!raw?.trim()) return true;
  return normalizePhoneToE164(raw) !== null;
}

export function formatPhoneDisplay(raw: string | null | undefined) {
  if (!raw) return '';

  const trimmed = raw.trim();
  if (!trimmed) return '';

  const digits = extractDigits(trimmed);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }

  if (trimmed.startsWith('+') && digits) {
    return `+${digits}`;
  }

  return trimmed;
}

export function getPhoneInputHint(raw: string | null | undefined, emptyHint: string) {
  if (!raw?.trim()) return emptyHint;

  const normalized = normalizePhoneToE164(raw);
  if (normalized) {
    return 'Looks good.';
  }

  return 'Enter a 10-digit number, like (610) 854-9109.';
}

export function formatAreaCodeInput(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(0, 3);
}

export function normalizeAreaCode(raw: string | null | undefined): string | null {
  const digits = formatAreaCodeInput(raw);
  return digits.length === 3 ? digits : null;
}

export function isAreaCodeValid(raw: string | null | undefined) {
  if (!raw?.trim()) return false;
  return normalizeAreaCode(raw) !== null;
}

export function getAreaCodeHint(raw: string | null | undefined) {
  const digits = formatAreaCodeInput(raw);
  if (!digits) {
    return 'Enter 3 digits, for example 302, 215, or 610.';
  }

  if (digits.length < 3) {
    return 'Area codes are 3 digits.';
  }

  return `We will try to provision a number in the ${digits} area code.`;
}