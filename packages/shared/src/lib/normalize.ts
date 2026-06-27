const whitespacePattern = /\s+/g;
const punctuationPattern = /[^\p{L}\p{N}\s]/gu;

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(whitespacePattern, " ");
}

export function stripPunctuation(value: string): string {
  return value.replace(punctuationPattern, " ");
}

export function normalizeLabel(value: string): string {
  return normalizeWhitespace(stripPunctuation(value).toLowerCase());
}

export function normalizeHostname(value: string): string {
  const trimmed = value.trim().toLowerCase();

  return trimmed.replace(/\.+$/, "");
}

export function normalizeNearbyContext(value: string): string {
  return normalizeWhitespace(stripPunctuation(value).toLowerCase());
}
