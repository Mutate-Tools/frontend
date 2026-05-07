export const DELETED_USER_LABEL = "[DELETED USER]";
export const DELETED_USER_AVATAR = "/assets/dapp/noProfileicon.svg";
const DELETED_USER_HASHES_KEY = "mutate_deleted_user_hashes_v1";

export type DeletedAwareUser = {
  emailHash: string;
  username: string | null;
  avatarId?: number;
  avatarUrl?: string | null;
  deleted?: boolean;
};

export const deletedUser = (emailHash: string): DeletedAwareUser => ({
  emailHash,
  username: DELETED_USER_LABEL,
  avatarId: 0,
  avatarUrl: null,
  deleted: true,
});

const readDeletedHashes = () => {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = window.localStorage.getItem(DELETED_USER_HASHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map((h) => String(h).toLowerCase()) : []);
  } catch {
    return new Set<string>();
  }
};

export const markDeletedUserHash = (emailHash: string) => {
  if (typeof window === "undefined" || !emailHash) return;
  const hash = emailHash.toLowerCase();
  const hashes = readDeletedHashes();
  hashes.add(hash);
  window.localStorage.setItem(DELETED_USER_HASHES_KEY, JSON.stringify(Array.from(hashes)));
};

export const isDeletedUserHash = (emailHash: string) =>
  !!emailHash && readDeletedHashes().has(emailHash.toLowerCase());

export const mergeUsersWithDeletedMarkers = <T extends DeletedAwareUser>(
  current: Record<string, T>,
  requestedHashes: string[],
  resolvedUsers: T[]
): Record<string, T> => {
  const next: Record<string, T> = { ...current };
  const resolved = new Set<string>();
  for (const user of resolvedUsers) {
    const hash = user.emailHash.toLowerCase();
    resolved.add(hash);
    next[hash] = { ...user, emailHash: hash };
  }
  for (const rawHash of requestedHashes) {
    const hash = rawHash.toLowerCase();
    if (!hash || resolved.has(hash)) continue;
    markDeletedUserHash(hash);
    next[hash] = deletedUser(hash) as T;
  }
  return next;
};

export const displayNameForUser = (
  user: DeletedAwareUser | undefined,
  hash: string,
  fallbackLength = 10
) => {
  if (user?.deleted || isDeletedUserHash(hash)) return DELETED_USER_LABEL;
  return user?.username || `${hash.slice(0, fallbackLength)}…`;
};

export const avatarForUser = <T>(
  user: DeletedAwareUser | undefined,
  hash: string,
  fallback: T
): string | T => {
  if (user?.deleted || isDeletedUserHash(hash)) return DELETED_USER_AVATAR;
  return user?.avatarUrl || fallback;
};

export const shouldUseDeletedAvatar = (user: DeletedAwareUser | undefined, hash: string) =>
  !!(user?.deleted || isDeletedUserHash(hash));
