/**
 * Utility functions for DINÂMICO PRO
 */

/**
 * Format sequence number with leading zeros (e.g., 1 -> "000001")
 */
export function formatSequence(num: number, digits = 6): string {
  if (isNaN(num) || num < 0) return '000000'.slice(0, digits);
  return String(num).padStart(digits, '0');
}

/**
 * Generate a clean, unique permanent ID for dynamic QR codes
 */
export function generatePlaqueId(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let result = 'dp-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format unix timestamp to readable Brazilian Portuguese date
 */
export function formatDate(timestamp: number): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Sanitize and validate destination URL
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return 'https://google.com';
  
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(sanitizeUrl(url));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
