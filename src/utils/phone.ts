/**
 * Normalizes a Bangladeshi phone number to 11-digit local format.
 * Strips country codes (+88 / 0088), spaces, and hyphens.
 * Returns the cleaned string (may be invalid if not 11 digits).
 */
export function normalizePhone(raw: string): string {
  // Remove all spaces and hyphens
  let cleaned = raw.replace(/[\s\-]/g, '');

  // Strip country code prefix variants: +880, 0088, +88
  if (cleaned.startsWith('+880')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('0088')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('+88')) {
    cleaned = '0' + cleaned.slice(3);
  }

  // Truncate to 11 digits max
  if (cleaned.length > 11) {
    cleaned = cleaned.slice(0, 11);
  }

  return cleaned;
}

/**
 * Returns true only if the phone is exactly 11 digits starting with 0.
 */
export function isValidPhone(phone: string): boolean {
  return /^0\d{10}$/.test(phone);
}

/**
 * onChange handler factory for phone input fields.
 * Normalizes and caps at 11 digits on every keystroke.
 */
export function handlePhoneChange(
  raw: string,
  setter: (val: string) => void
): void {
  const normalized = normalizePhone(raw);
  setter(normalized);
}
