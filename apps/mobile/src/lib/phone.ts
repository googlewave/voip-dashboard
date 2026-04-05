function extractDigits(value: string) {
  return value.replace(/\D/g, '');
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
