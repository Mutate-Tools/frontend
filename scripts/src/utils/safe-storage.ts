












const RATCHET_PREFIX = "ratchet_v3_";






function oldestRatchetKeys(count: number): string[] {
  const keys: { key: string; savedAt: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(RATCHET_PREFIX)) continue;
    let savedAt = 0;
    try {
      const raw = localStorage.getItem(k);
      if (raw) savedAt = JSON.parse(raw)?.savedAt ?? 0;
    } catch {}
    keys.push({ key: k, savedAt });
  }
  keys.sort((a, b) => a.savedAt - b.savedAt);
  return keys.slice(0, count).map((e) => e.key);
}


function evictOldestRatchets(n = 3): void {
  for (const k of oldestRatchetKeys(n)) {
    try {
      localStorage.removeItem(k);
    } catch {}
  }
}






export function lsSet(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    if (err?.name === "QuotaExceededError" || err?.code === 22) {
      
      evictOldestRatchets(3);
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        
        
        console.warn(
          "[safe-storage] localStorage quota full — could not persist key:",
          key,
          ". Some chat history may not load after refresh."
        );
      }
    }
    return false;
  }
}


export function lsGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}


export function lsRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}


export function lsSetJSON(key: string, value: unknown): boolean {
  try {
    return lsSet(key, JSON.stringify(value));
  } catch {
    return false;
  }
}


export function lsGetJSON<T = unknown>(key: string): T | null {
  const raw = lsGet(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
