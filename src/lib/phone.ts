/**
 * Normalizes a Kenyan phone number to canonical +254XXXXXXXXX form so the
 * same physical number is always recognized as the same value regardless of
 * how a person typed it (07.., 7.., 254.., +254..). Returns null if the
 * input doesn't look like a valid Kenyan mobile number.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let national: string | null = null;

  if (/^\+254[71]\d{8}$/.test(digits)) {
    national = digits.slice(4);
  } else if (/^254[71]\d{8}$/.test(digits)) {
    national = digits.slice(3);
  } else if (/^0[71]\d{8}$/.test(digits)) {
    national = digits.slice(1);
  } else if (/^[71]\d{8}$/.test(digits)) {
    national = digits;
  }

  if (!national) return null;
  return `+254${national}`;
}

export function formatPhoneForDisplay(normalized: string) {
  return normalized;
}
