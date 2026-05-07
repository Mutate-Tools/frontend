export type PointMeta = {
  plainLength: number;
  clientTextFingerprint: string;
  sentAt: string;
};

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const fallbackHash = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
};

export async function buildPointMeta(
  content: string,
  context: string
): Promise<PointMeta | undefined> {
  const normalized = normalizeText(content);
  if (!normalized) return undefined;
  const payload = `${context}:${normalized}`;
  let clientTextFingerprint = fallbackHash(payload);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = new TextEncoder().encode(payload);
    clientTextFingerprint = toHex(await crypto.subtle.digest("SHA-256", bytes));
  }
  return {
    plainLength: normalized.length,
    clientTextFingerprint,
    sentAt: new Date().toISOString(),
  };
}

export function notifyPointsMayHaveChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mutate:points-refresh"));
  }
}
