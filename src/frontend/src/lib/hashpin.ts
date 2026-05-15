/**
 * Hash a PIN string using SHA-256 (Web Crypto API).
 * Returns lowercase hex string.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Synchronous simple hash for legacy localStorage comparison.
 * Used when Web Crypto is not needed (local-only mode).
 */
export function simpleHash(pin: string): string {
  // Simple deterministic hash for local comparison
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `kf_${Math.abs(hash).toString(16).padStart(8, "0")}`;
}
