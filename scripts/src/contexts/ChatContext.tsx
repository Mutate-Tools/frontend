"use client";

import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";







const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { encodeBase64 } from "tweetnacl-util";
import { useAuth } from "./AuthContext";
import { useSubProfile } from "./SubProfileContext";
import { E2EE_KEYS_READY_EVENT, useDevice } from "./DeviceContext";
import {
  RatchetState,
  deserializeRatchetState,
  encryptRatchet,
  decryptRatchet,
  initiateSessionAsInitiator,
  initiateSessionAsResponder,
  serializeRatchetState,
} from "@/src/utils/crypto/double-ratchet-util";
import { generateUserPrekeyBundle, initiateX3DH, respondX3DH } from "@/src/utils/crypto/x3dh-util";
import {
  generateIdentityKeypair,
  getIdentityKeypair,
  listStoredIdentityHashes,
  storeIdentityKeypair,
} from "@/src/utils/crypto/identity-util";
import { encryptFileBytes } from "@/src/utils/crypto/file-crypto-util";
import {
  storageUtil,
  LocalMessage,
  LocalGroupMessage,
} from "@/src/utils/crypto/storage-util";
import {
  decryptGroupMessage,
  encryptGroupMessage,
  generateGroupKey,
  GroupKeyEnvelope,
  unwrapGroupKey,
  wrapGroupKeyForMember,
} from "@/src/utils/crypto/group-key-util";
import { decryptFromDevice, encryptForDevice } from "@/src/utils/crypto/device-crypto-util";
import { markDeletedUserHash } from "@/src/utils/deleted-user-util";
import { getBackendUrl } from '@/src/utils/backend-url';
import { buildPointMeta, notifyPointsMayHaveChanged } from "@/src/utils/point-meta";
import { lsGet, lsGetJSON, lsRemove, lsSet, lsSetJSON } from "@/src/utils/safe-storage";

export interface GroupMemberRef {
  emailHash: string;
  keyId: number;
  joinedAt?: string;
  username?: string | null;
  avatarId?: number;
}

export interface GroupPendingMember {
  emailHash: string;
  requestedAt?: string;
  username?: string | null;
  avatarId?: number;
}

export interface GroupDoc {
  _id: string;
  name: string;
  description?: string;
  avatarId?: number;
  isPublic?: boolean;
  shareToken?: string;
  createdBy: string;
  admins: string[];
  members: GroupMemberRef[];
  pendingMembers?: GroupPendingMember[];
  currentKeyId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DMSummary {
  otherHash: string;
  contentTopic: string;
  lastMessage?: LocalMessage;
}

export type SelectedChat =
  | { type: "dm"; otherHash: string }
  | { type: "group"; groupId: string }
  | null;

export type ChatKey = `dm:${string}` | `group:${string}`;

export interface ProfilePreview {
  emailHash: string;
  username: string | null;
  avatarId: number;
  publicIdentityKey: string | null;
}

export type SendOpts = { messageType?: "text" | "file" };

export type AttachmentTarget =
  | { type: "dm"; otherHash: string }
  | { type: "group"; groupId: string };

export interface AttachmentMeta {
  kind: "attachment";
  url: string;
  name: string;
  size: number;
  mime: string;
  caption?: string;
  key?: string;
  nonce?: string;
}

export interface DMReadState {
  mine: Record<string, number>;
  theirs: Record<string, number>;
}

export type GroupReads = Record<string, Array<{ emailHash: string; readAt: number }>>;
export type TypingMap = Record<ChatKey, string[]>;

export interface JoinResult {
  status: "joined" | "requested" | "already-member";
  group: GroupDoc;
  newKeyId?: number;
}

interface ChatContextType {
  socket: Socket | null;
  currentIdentityHash: string | null;
  dms: DMSummary[];
  groups: GroupDoc[];
  groupsHasMore: boolean;
  groupsLoading: boolean;
  dmsLoading: boolean;
  messages: LocalMessage[];
  groupMessages: LocalGroupMessage[];
  selectedChat: SelectedChat;
  setSelectedChat: (c: SelectedChat) => void;
  loading: boolean;
  isLoadingChatMessages: boolean;
  error: string | null;

  dmReadState: DMReadState;
  groupReads: GroupReads;
  typingPeers: TypingMap;

  sendDirectMessage: (recipientHash: string, content: string, opts?: SendOpts) => Promise<void>;
  sendGroupMessage: (groupId: string, content: string, opts?: SendOpts) => Promise<void>;
  sendAttachment: (target: AttachmentTarget, file: File, caption?: string) => Promise<void>;
  createGroup: (
    name: string,
    memberHashes: string[],
    opts?: { description?: string; avatarId?: number; isPublic?: boolean }
  ) => Promise<GroupDoc>;
  addGroupMember: (groupId: string, newMemberHash: string) => Promise<void>;
  removeGroupMember: (groupId: string, memberHash: string) => Promise<void>;
  promoteGroupAdmin: (groupId: string, memberHash: string) => Promise<void>;
  demoteGroupAdmin: (groupId: string, memberHash: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  updateGroup: (
    groupId: string,
    patch: { name?: string; description?: string; avatarId?: number; isPublic?: boolean }
  ) => Promise<GroupDoc>;
  manageGroupRequest: (
    groupId: string,
    requesterHash: string,
    action: "approve" | "reject"
  ) => Promise<GroupDoc>;

  previewProfile: (username: string) => Promise<ProfilePreview | null>;
  previewGroup: (shareToken: string) => Promise<GroupDoc | null>;
  joinGroupByShareToken: (
    shareToken: string,
    opts?: { identityHash?: string | null }
  ) => Promise<JoinResult>;

  markDirectRead: (peerHash: string, lastReadAt?: number) => Promise<void>;
  markGroupRead: (groupId: string, messageIds: string[]) => Promise<void>;
  refreshReadState: () => Promise<void>;
  




  groupOpenedAt: Record<string, number>;
  markGroupOpened: (groupId: string, when?: number) => Promise<void>;
  refreshGroupOpenedState: () => Promise<void>;

  startTyping: (target: { type: "dm" | "group"; chatId: string }) => void;
  stopTyping: (target: { type: "dm" | "group"; chatId: string }) => void;

  refreshGroups: (opts?: { reset?: boolean; limit?: number }) => Promise<void>;
  loadMoreGroups: () => Promise<void>;
  refreshDMs: () => Promise<void>;

  


  loadOlderMessages: () => Promise<void>;
  
  hasMoreMessages: boolean;
  
  isLoadingOlderMessages: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);


const ratchetKey = (ownerHash: string, otherHash: string) =>
  `ratchet_v3_${ownerHash.toLowerCase()}_${otherHash.toLowerCase()}`;

const dmLocalId = (ownerHash: string, messageId: string) =>
  `${ownerHash.toLowerCase()}:${String(messageId)}`;

const dmPendingKey = (ownerHash: string, otherHash: string, message: string) =>
  JSON.stringify([ownerHash.toLowerCase(), otherHash.toLowerCase(), message]);

const groupPendingKey = (ownerHash: string, groupId: string, message: string) =>
  JSON.stringify([ownerHash.toLowerCase(), groupId, message]);

const reconcileConfirmedMessage = <T extends { _id: string }>(
  items: T[],
  confirmed: T,
  pendingId?: string | null
): T[] => {
  let changed = false;
  let inserted = false;
  const next: T[] = [];

  for (const item of items) {
    if (pendingId && item._id === pendingId) {
      if (!inserted) next.push(confirmed);
      inserted = true;
      changed = true;
      continue;
    }
    if (item._id === confirmed._id) {
      if (!inserted) next.push(confirmed);
      inserted = true;
      changed = changed || item !== confirmed;
      continue;
    }
    next.push(item);
  }

  if (!inserted) {
    next.push(confirmed);
    changed = true;
  }

  return changed ? next : items;
};

const perfNow = () =>
  typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

const logPerf = (label: string, startedAt: number, minMs = 120) => {
  if (process.env.NODE_ENV === "production") return;
  const elapsed = Math.round(perfNow() - startedAt);
  if (elapsed >= minMs) console.debug(`[ChatPerf] ${label}: ${elapsed}ms`);
};

const emitDMActivity = (otherHash: string, timestamp: number) => {
  if (typeof window === "undefined" || !otherHash || !timestamp) return;
  window.dispatchEvent(
    new CustomEvent("chat:dm-activity", {
      detail: {
        otherHash: otherHash.toLowerCase(),
        lastChatAt: new Date(timestamp).toISOString(),
      },
    })
  );
};





const ratchetMemCache = new Map<string, RatchetState>();


const ratchetPersistTimers = new Map<string, ReturnType<typeof setTimeout>>();

function persistRatchetNow(key: string) {
  const state = ratchetMemCache.get(key);
  if (!state) return;
  const timer = ratchetPersistTimers.get(key);
  if (timer) clearTimeout(timer);
  ratchetPersistTimers.delete(key);
  lsSet(key, serializeRatchetState(state));
}

function flushPendingRatchets() {
  for (const key of Array.from(ratchetPersistTimers.keys())) {
    persistRatchetNow(key);
  }
}

if (typeof window !== "undefined" && !(window as any).__mutateRatchetFlushInstalled) {
  (window as any).__mutateRatchetFlushInstalled = true;
  window.addEventListener("pagehide", flushPendingRatchets);
  window.addEventListener("beforeunload", flushPendingRatchets);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPendingRatchets();
  });
}

function loadRatchet(ownerHash: string, otherHash: string): RatchetState | null {
  const key = ratchetKey(ownerHash, otherHash);
  const cached = ratchetMemCache.get(key);
  if (cached) return cached;
  const stored = lsGet(key);
  if (!stored) return null;
  try {
    const state = deserializeRatchetState(stored);
    ratchetMemCache.set(key, state);
    return state;
  } catch {
    return null;
  }
}

function saveRatchet(ownerHash: string, otherHash: string, state: RatchetState) {
  const key = ratchetKey(ownerHash, otherHash);
  
  ratchetMemCache.set(key, state);
  
  
  const existing = ratchetPersistTimers.get(key);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    persistRatchetNow(key);
  }, 1_000);
  ratchetPersistTimers.set(key, timer);
}

const GROUP_KEY_PLACEHOLDERS = new Set(["[No group key]", "[Decryption Failed]"]);

const upsertById = <T extends { _id: string }>(items: T[], next: T): T[] => {
  const idx = items.findIndex((item) => item._id === next._id);
  if (idx === -1) return [...items, next];
  const copy = [...items];
  copy[idx] = next;
  return copy;
};

const dedupeById = <T extends { _id: string }>(items: T[]): T[] => {
  const map = new Map<string, T>();
  for (const item of items) map.set(item._id, item);
  return Array.from(map.values());
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const { emailHash: parentEmailHash, token, isConnected } = useAuth();
  const { activeIdentityHash, activeSubProfile, subProfiles } = useSubProfile();
  const {
    deviceId,
    deviceKeypair,
    listDevicesForIdentity,
    backupVault,
    vaultUnlocked,
    deviceSetupMode,
    freshStartAt,
  } = useDevice();






  const parentHash = parentEmailHash?.toLowerCase() || null;
  const activeHash = activeIdentityHash?.toLowerCase() || null;
  const emailHash = activeHash && activeHash !== parentHash ? activeHash : null;
  const [dms, setDMs] = useState<DMSummary[]>([]);
  const [groups, setGroups] = useState<GroupDoc[]>([]);
  const [groupsHasMore, setGroupsHasMore] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [dmsLoading, setDmsLoading] = useState(false);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [groupMessages, setGroupMessages] = useState<LocalGroupMessage[]>([]);
  const [selectedChat, setSelectedChatState] = useState<SelectedChat>(null);
  const [isLoadingChatMessages, setIsLoadingChatMessages] = useState(false);
  
  
  const setSelectedChat = useCallback((chat: SelectedChat | null) => {
    
    if (chat) {
      setIsLoadingChatMessages(true);
    } else {
      
      setIsLoadingChatMessages(false);
    }
    setSelectedChatState(chat);
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const isLoadingOlderRef = useRef(false);
  
  const messagesRef = useRef<LocalMessage[]>([]);
  const groupMessagesRef = useRef<LocalGroupMessage[]>([]);
  messagesRef.current = messages;
  groupMessagesRef.current = groupMessages;

  const [dmReadState, setDmReadState] = useState<DMReadState>({ mine: {}, theirs: {} });
  const [groupReads, setGroupReads] = useState<GroupReads>({});
  const [groupOpenedAt, setGroupOpenedAt] = useState<Record<string, number>>({});
  const [typingPeers, setTypingPeers] = useState<TypingMap>({} as TypingMap);

  const socketRef = useRef<Socket | null>(null);
  const processingQueue = useRef<any[]>([]);
  const isProcessing = useRef(false);
  const selectedChatRef = useRef<SelectedChat>(null);
  selectedChatRef.current = selectedChat;

  // Kept in sync with all sub-profile identity hashes owned by this account so
  // the dm:new handler can distinguish messages for the active profile from
  // messages that arrived on a passive sub-profile room.
  const subProfileHashesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    subProfileHashesRef.current = new Set(
      subProfiles.map((sp) => sp.identityHash.toLowerCase())
    );
  }, [subProfiles]);





  const prevEmailHashRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevEmailHashRef.current;
    if (prev && prev !== emailHash) {
      
      
      setMessages([]);
      setGroupMessages([]);
      
      
      setGroups([]);
      setGroupsHasMore(true);
      setDmReadState({ mine: {}, theirs: {} });
      setGroupReads({});
      setGroupOpenedAt({});
      setSelectedChat(null);
      setHasMoreMessages(true);
    }
    prevEmailHashRef.current = emailHash || null;
  }, [emailHash]);

  












  const readStateHydratedForRef = useRef<string | null>(null);
  const dmReadStateCacheKey = (hash: string) =>
    `mutate_dm_read_state_${hash}`;
  const groupOpenedAtCacheKey = (hash: string) =>
    `mutate_group_opened_at_${hash}`;

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (!emailHash) {
      readStateHydratedForRef.current = null;
      return;
    }
    if (readStateHydratedForRef.current === emailHash) return;

    const dmCached = lsGetJSON<{ mine: Record<string, number>; theirs: Record<string, number> }>(
      dmReadStateCacheKey(emailHash)
    );
    if (dmCached && typeof dmCached === "object") {
      setDmReadState({
        mine: dmCached.mine && typeof dmCached.mine === "object" ? dmCached.mine : {},
        theirs: dmCached.theirs && typeof dmCached.theirs === "object" ? dmCached.theirs : {},
      });
    }

    const groupCached = lsGetJSON<Record<string, number>>(groupOpenedAtCacheKey(emailHash));
    if (groupCached && typeof groupCached === "object") {
      setGroupOpenedAt(groupCached);
    }

    readStateHydratedForRef.current = emailHash;
  }, [emailHash]);

  
  
  
  
  useEffect(() => {
    if (typeof window === "undefined" || !emailHash) return;
    if (readStateHydratedForRef.current !== emailHash) return;
    const timer = setTimeout(() => {
      lsSetJSON(dmReadStateCacheKey(emailHash), dmReadState);
    }, 500);
    return () => clearTimeout(timer);
  }, [emailHash, dmReadState]);

  useEffect(() => {
    if (typeof window === "undefined" || !emailHash) return;
    if (readStateHydratedForRef.current !== emailHash) return;
    const timer = setTimeout(() => {
      lsSetJSON(groupOpenedAtCacheKey(emailHash), groupOpenedAt);
    }, 500);
    return () => clearTimeout(timer);
  }, [emailHash, groupOpenedAt]);
  const typingEmitTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const typingExpireTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const groupsRef = useRef<GroupDoc[]>([]);
  groupsRef.current = groups;
  const deviceListCacheRef = useRef(new Map<string, { expiresAt: number; devices: any[] }>());
  const prekeyCacheRef = useRef(new Map<string, { expiresAt: number; bundle: any }>());
  const vaultBackupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDMIdsRef = useRef(new Map<string, string[]>());
  const pendingGroupIdsRef = useRef(new Map<string, string[]>());
  
  
  
  const dmSyncInProgressRef = useRef(false);
  const dmSyncBufferRef = useRef<any[]>([]);

  const rememberPendingDM = useCallback(
    (ownerHash: string, otherHash: string, message: string, pendingId: string) => {
      const key = dmPendingKey(ownerHash, otherHash, message);
      const queue = pendingDMIdsRef.current.get(key) || [];
      pendingDMIdsRef.current.set(key, [...queue, pendingId]);
    },
    []
  );

  const takePendingDM = useCallback(
    (ownerHash: string, otherHash: string, message: string) => {
      const key = dmPendingKey(ownerHash, otherHash, message);
      const queue = pendingDMIdsRef.current.get(key);
      const pendingId = queue?.shift() || null;
      if (!queue || queue.length === 0) pendingDMIdsRef.current.delete(key);
      else pendingDMIdsRef.current.set(key, queue);
      return pendingId;
    },
    []
  );

  const forgetPendingDM = useCallback(
    (ownerHash: string, otherHash: string, message: string, pendingId: string) => {
      const key = dmPendingKey(ownerHash, otherHash, message);
      const queue = pendingDMIdsRef.current.get(key);
      if (!queue) return;
      const next = queue.filter((id) => id !== pendingId);
      if (next.length === 0) pendingDMIdsRef.current.delete(key);
      else pendingDMIdsRef.current.set(key, next);
    },
    []
  );

  const rememberPendingGroupMessage = useCallback(
    (ownerHash: string, groupId: string, message: string, pendingId: string) => {
      const key = groupPendingKey(ownerHash, groupId, message);
      const queue = pendingGroupIdsRef.current.get(key) || [];
      pendingGroupIdsRef.current.set(key, [...queue, pendingId]);
    },
    []
  );

  const takePendingGroupMessage = useCallback(
    (ownerHash: string, groupId: string, message: string) => {
      const key = groupPendingKey(ownerHash, groupId, message);
      const queue = pendingGroupIdsRef.current.get(key);
      const pendingId = queue?.shift() || null;
      if (!queue || queue.length === 0) pendingGroupIdsRef.current.delete(key);
      else pendingGroupIdsRef.current.set(key, queue);
      return pendingId;
    },
    []
  );

  const forgetPendingGroupMessage = useCallback(
    (ownerHash: string, groupId: string, message: string, pendingId: string) => {
      const key = groupPendingKey(ownerHash, groupId, message);
      const queue = pendingGroupIdsRef.current.get(key);
      if (!queue) return;
      const next = queue.filter((id) => id !== pendingId);
      if (next.length === 0) pendingGroupIdsRef.current.delete(key);
      else pendingGroupIdsRef.current.set(key, next);
    },
    []
  );

  const purgeDeletedDMPeer = useCallback(
    async (
      peerHashRaw: string,
      options?: { markDeleted?: boolean; deletedAt?: string | number | Date | null }
    ) => {
      if (!emailHash || !peerHashRaw) return;
      const myHash = emailHash.toLowerCase();
      const peerHash = peerHashRaw.toLowerCase();
      if (options?.markDeleted !== false) markDeletedUserHash(peerHash);
      const cutoff =
        options?.deletedAt && options.markDeleted === false
          ? new Date(options.deletedAt).getTime()
          : NaN;
      if (Number.isFinite(cutoff)) {
        await storageUtil.clearChatBefore(myHash, peerHash, cutoff).catch(() => {});
      } else {
        await storageUtil.clearChat(myHash, peerHash).catch(() => {});
      }
      const remainingHistory = Number.isFinite(cutoff)
        ? await storageUtil.getChatHistory(myHash, peerHash).catch(() => [])
        : [];
      const latestRemaining = remainingHistory[remainingHistory.length - 1];
      setDMs((prev) => {
        if (!latestRemaining) return prev.filter((dm) => dm.otherHash !== peerHash);
        const idx = prev.findIndex((dm) => dm.otherHash === peerHash);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = { ...next[idx], lastMessage: latestRemaining };
        return next;
      });
      const selected = selectedChatRef.current;
      if (selected?.type === "dm" && selected.otherHash === peerHash) {
        if (latestRemaining) {
          setMessages((prev) =>
            prev.filter((msg) => msg.chatId !== peerHash || msg.timestamp > cutoff)
          );
        } else {
          setMessages([]);
          setSelectedChat(null);
        }
      } else {
        setMessages((prev) =>
          Number.isFinite(cutoff)
            ? prev.filter((msg) => msg.chatId !== peerHash || msg.timestamp > cutoff)
            : prev.filter((msg) => msg.chatId !== peerHash)
        );
      }
      setDmReadState((prev) => {
        const mine = { ...prev.mine };
        const theirs = { ...prev.theirs };
        delete mine[peerHash];
        delete theirs[peerHash];
        return { mine, theirs };
      });
      setTypingPeers((prev) => {
        const key = `dm:${peerHash}` as ChatKey;
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [emailHash]
  );

  const scheduleVaultBackup = useCallback(() => {
    if (!vaultUnlocked) return;
    if (vaultBackupTimerRef.current) clearTimeout(vaultBackupTimerRef.current);
    vaultBackupTimerRef.current = setTimeout(() => {
      const startedAt = perfNow();
      backupVault()
        .then(() => logPerf("vault backup", startedAt, 250))
        .catch(() => {});
      vaultBackupTimerRef.current = null;
    }, 1200);
  }, [vaultUnlocked, backupVault]);

  const scopedHeaders = useCallback(() => {
    if (!token || !emailHash) return null;
    return {
      Authorization: `Bearer ${token}`,
      "X-Identity-Hash": emailHash.toLowerCase(),
    };
  }, [token, emailHash]);

  useEffect(() => {
    return () => {
      if (vaultBackupTimerRef.current) clearTimeout(vaultBackupTimerRef.current);
    };
  }, []);

  const getCachedDevicesForIdentity = useCallback(
    async (identityHash: string) => {
      const hash = identityHash.toLowerCase();
      const cached = deviceListCacheRef.current.get(hash);
      if (cached && cached.expiresAt > Date.now()) return cached.devices;
      const startedAt = perfNow();
      const devices = (await listDevicesForIdentity(hash)).filter((device: any) => device.status === "active");
      logPerf(`device lookup ${hash.slice(0, 8)}`, startedAt, 150);
      deviceListCacheRef.current.set(hash, {
        expiresAt: Date.now() + 45_000,
        devices,
      });
      return devices;
    },
    [listDevicesForIdentity]
  );

  const getFreshStartBoundary = useCallback(() => {
      let mode = deviceSetupMode;
      let startedAt = freshStartAt;
      if (typeof window !== "undefined" && parentEmailHash) {
        const parent = parentEmailHash.toLowerCase();
        mode =
          mode ||
          (lsGet(`parent_device_mode_${parent}`) as typeof deviceSetupMode) ||
          (lsGet(`device_setup_mode_${parent}`) as typeof deviceSetupMode);
        startedAt =
          startedAt ||
          Number(lsGet(`parent_fresh_started_at_${parent}`) || 0) ||
          null;
      }
      return mode === "fresh_start" && startedAt ? startedAt : null;
    },
    [deviceSetupMode, freshStartAt, parentEmailHash]
  );

  const shouldHideForFreshStart = useCallback(
    (createdAt?: string | number | null) => {
      const startedAt = getFreshStartBoundary();
      if (!startedAt || !createdAt) return false;
      const timestamp =
        typeof createdAt === "number" ? createdAt : new Date(createdAt).getTime();
      return Number.isFinite(timestamp) && timestamp < startedAt;
    },
    [getFreshStartBoundary]
  );

  const filterLocalHistoryForFreshStart = useCallback(
    function filterLocalHistoryForFreshStart<T extends { timestamp: number }>(items: T[]): T[] {
      const startedAt = getFreshStartBoundary();
      if (!startedAt) return items;
      return items.filter((item) => item.timestamp >= startedAt);
    },
    [getFreshStartBoundary]
  );

  const uploadFreshIdentityMaterial = useCallback(
    async (hash: string, keypair: ReturnType<typeof getIdentityKeypair>) => {
      if (!token || !keypair) return;
      const normalized = hash.toLowerCase();
      const publicIdentityKey = encodeBase64(keypair.encryption.publicKey);
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (normalized !== parentEmailHash?.toLowerCase()) {
        headers["X-Identity-Hash"] = normalized;
      }
      const BACKEND_URL = getBackendUrl();
      await axios.post(
        `${BACKEND_URL}/auth/oidc/identity-key`,
        { publicIdentityKey },
        { headers }
      );
      const bundle = generateUserPrekeyBundle(keypair);
      await axios.post(`${BACKEND_URL}/auth/oidc/prekey-bundle`, bundle, { headers });
      lsSet(`bundle_uploaded_${normalized}_${publicIdentityKey}`, "true");
    },
    [token, parentEmailHash]
  );

  const fetchPrekeyBundle = useCallback(
    async (identityHash: string) => {
      if (!token) throw new Error("Not authenticated");
      const hash = identityHash.toLowerCase();
      const cached = prekeyCacheRef.current.get(hash);
      if (cached && cached.expiresAt > Date.now()) return cached.bundle;
      const startedAt = perfNow();
      const BACKEND_URL = getBackendUrl();
      const bundleRes = await axios.get(`${BACKEND_URL}/auth/oidc/prekey-bundle/${hash}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bundle = bundleRes.data;
      prekeyCacheRef.current.set(hash, {
        expiresAt: Date.now() + 60_000,
        bundle: { ...bundle, oneTimePrekey: null },
      });
      logPerf(`prekey fetch ${hash.slice(0, 8)}`, startedAt, 150);
      return bundle;
    },
    [token]
  );

  const ensureLocalIdentityKeypair = useCallback(
    async (hash: string) => {
      const normalized = hash.toLowerCase();
      let keypair = getIdentityKeypair(normalized);
      if (keypair) {
        if (deviceSetupMode === "fresh_start") {
          const uploadedKey = `bundle_uploaded_${normalized}_${encodeBase64(keypair.encryption.publicKey)}`;
          if (!lsGet(uploadedKey)) {
            await uploadFreshIdentityMaterial(normalized, keypair);
          }
        }
        return keypair;
      }

      const knownSubProfile =
        activeSubProfile?.identityHash?.toLowerCase() === normalized
          ? activeSubProfile
          : subProfiles.find((profile) => profile.identityHash.toLowerCase() === normalized) || null;
      const expectedPublicKey =
        knownSubProfile?.publicIdentityKey || null;

      if (expectedPublicKey) {
        for (const storedHash of listStoredIdentityHashes()) {
          const candidate = getIdentityKeypair(storedHash);
          if (!candidate) continue;
          if (encodeBase64(candidate.encryption.publicKey) === expectedPublicKey) {
            storeIdentityKeypair(normalized, candidate);
            return candidate;
          }
        }
      }

      const parentHash = parentEmailHash?.toLowerCase() || null;
      if (expectedPublicKey && parentHash && parentHash !== normalized) {
        const parentKeypair = getIdentityKeypair(parentHash);
        if (
          parentKeypair &&
          encodeBase64(parentKeypair.encryption.publicKey) === expectedPublicKey
        ) {
          storeIdentityKeypair(normalized, parentKeypair);
          return parentKeypair;
        }
      }

      if (!token) return null;
      if (normalized !== parentHash && !knownSubProfile) {
        throw new Error("This subprofile is still loading on this device. Try again.");
      }

      keypair = generateIdentityKeypair();
      storeIdentityKeypair(normalized, keypair);
      await uploadFreshIdentityMaterial(normalized, keypair);
      window.dispatchEvent(new Event(E2EE_KEYS_READY_EVENT));
      return keypair;
    },
    [activeSubProfile, parentEmailHash, subProfiles, token, deviceSetupMode, uploadFreshIdentityMaterial]
  );

  const rehydrateGroupMessagesForKey = useCallback(
    async (groupId: string, keyId: number) => {
      if (!token || !emailHash) return;
      const myHash = emailHash.toLowerCase();
      const keyEntry = await storageUtil.getGroupKey(myHash, groupId, keyId);
      if (!keyEntry) return;

      const existing = await storageUtil.getGroupHistory(myHash, groupId);
      const existingIds = new Set(existing.map((msg) => msg._id));
      const pendingIds = new Set(
        existing
          .filter((msg) => GROUP_KEY_PLACEHOLDERS.has(msg.message))
          .map((msg) => msg._id)
      );

      const BACKEND_URL = getBackendUrl();
      try {
        const boundary = getFreshStartBoundary();
        const res = await axios.get(`${BACKEND_URL}/groups/${groupId}/messages`, {
          params: boundary ? { since: new Date(boundary).toISOString() } : undefined,
          headers: { Authorization: `Bearer ${token}` },
        });

        for (const env of res.data.messages || []) {
          const messageId = String(env._id);
          if (env.keyId !== keyId) continue;
          if (shouldHideForFreshStart(env.createdAt)) continue;
          if (existingIds.has(messageId) && !pendingIds.has(messageId)) continue;
          try {
            const plaintext = decryptGroupMessage(keyEntry.groupKey, env.ciphertext, env.nonce);
            await storageUtil.saveGroupMessage({
              _id: messageId,
              ownerHash: myHash,
              groupId,
              senderEmailHash: (env.senderEmailHash || "").toLowerCase(),
              message: plaintext,
              timestamp: env.createdAt ? new Date(env.createdAt).getTime() : Date.now(),
            });
          } catch (e: any) {
            console.error("[Chat] rehydrate group message failed", e.message);
          }
        }

        const sel = selectedChatRef.current;
        if (sel?.type === "group" && sel.groupId === groupId) {
          const history = await storageUtil.getGroupHistory(myHash, groupId);
          setGroupMessages(filterLocalHistoryForFreshStart(history));
        }
      } catch (e: any) {
        console.error("[Chat] rehydrate group history failed", e.message);
      }
    },
    [token, emailHash, shouldHideForFreshStart, getFreshStartBoundary, filterLocalHistoryForFreshStart]
  );



  const handleIncomingDM = useCallback(
    async (env: any) => {
      if (!emailHash) return;
      if (shouldHideForFreshStart(env.createdAt)) return;
      const myHash = emailHash.toLowerCase();
      const senderHash = env.senderEmailHash?.toLowerCase();
      const recipientHash = env.recipientEmailHash?.toLowerCase();
      if (!senderHash || !recipientHash) return;

      const otherHash = senderHash === myHash ? recipientHash : senderHash;
      const serverMessageId = String(env._id);
      const localMessageId = dmLocalId(myHash, serverMessageId);

      const existing =
        (await storageUtil.getMessage(localMessageId)) ||
        (await storageUtil.getMessage(serverMessageId));
      if (existing && existing.ownerHash === myHash && existing.chatId === otherHash) {
        
        
        
        
        
        if (!dmSyncInProgressRef.current) {
          emitDMActivity(otherHash, existing.timestamp);
          setDMs((prev) => {
            const idx = prev.findIndex((d) => d.otherHash === otherHash);
            let next: DMSummary[];
            if (idx === -1) {
              next = [{ otherHash, contentTopic: `chat-${[myHash, otherHash].sort().join("-")}`, lastMessage: existing }, ...prev];
            } else {
              next = prev.slice();
              next[idx] = { ...next[idx], lastMessage: existing };
            }
            next.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
            return next;
          });
        }
        const sel = selectedChatRef.current;
        if (sel?.type === "dm" && sel.otherHash === otherHash) {
          const pendingToReplace =
            senderHash === myHash ? takePendingDM(myHash, otherHash, existing.message) : null;
          setMessages((prev) => reconcileConfirmedMessage(prev, existing, pendingToReplace));
        }
        return;
      }

      const deviceEnvelope = Array.isArray(env.envelopes)
        ? env.envelopes.find((e: any) => {
            const forHash = String(e?.forEmailHash || "").toLowerCase();
            const forDevice = e?.forDeviceId ? String(e.forDeviceId) : "";
            return forHash === myHash && (!forDevice || forDevice === deviceId);
          })
        : null;

      let plaintext = "[Encrypted Message]";
      if (deviceEnvelope?.encryptedPayload?.scheme === "device-box-v1" && deviceKeypair) {
        try {
          plaintext = decryptFromDevice(deviceEnvelope.encryptedPayload, deviceKeypair);
        } catch (e: any) {
          console.error("[Chat] device envelope decrypt failed:", e.message);
          return;
        }
      } else if (senderHash !== myHash) {
        const idKp = getIdentityKeypair(myHash);
        if (!idKp) return;

        let session = loadRatchet(myHash, otherHash);





        if (!session) {
          const incomingAlice = env.encryptedPayload?.aliceIdentityKey;
          if (incomingAlice) {
            const prefix = `ratchet_v3_${myHash}_`;
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (!k || !k.startsWith(prefix)) continue;
              if (k.endsWith(`_${otherHash}`)) continue;
              try {
                const raw = lsGet(k);
                if (!raw) continue;
                const candidate = deserializeRatchetState(raw);
                const theirKey =
                  (candidate as any).theirIdentityPublicKey ||
                  (candidate as any).handshake?.aliceIdentityKey;
                if (theirKey === incomingAlice) {
                  session = candidate;
                  
                  ratchetMemCache.set(ratchetKey(myHash, otherHash), candidate);
                  lsSet(ratchetKey(myHash, otherHash), raw);
                  lsRemove(k);
                  break;
                }
              } catch {}
            }
          }
        }
        if (!session) {
          const aliceIdentityKey = env.encryptedPayload?.aliceIdentityKey;
          const aliceEphemeralKey = env.encryptedPayload?.aliceEphemeralKey;
          if (!aliceIdentityKey || !aliceEphemeralKey) return;
          
          
          
          
          
          
          try {
            const sharedSecret = respondX3DH(
              idKp,
              aliceIdentityKey,
              aliceEphemeralKey,
              env.encryptedPayload.usedSignedPrekey || encodeBase64(idKp.encryption.publicKey),
              env.encryptedPayload.usedOneTimePrekeyId
            );
            session = initiateSessionAsResponder(
              idKp.encryption.secretKey,
              aliceIdentityKey,
              sharedSecret,
            );
          } catch (e: any) {
            console.warn(
              `[Chat] Skipping DM from ${otherHash.slice(0, 8)} — stale prekey (${e?.message || "x3dh failed"})`,
            );
            return;
          }
        }

        try {
          plaintext = decryptRatchet(
            session,
            env.encryptedPayload.header,
            env.encryptedPayload.ciphertext,
            env.encryptedPayload.nonce
          );
          if (session.handshake) delete session.handshake;
          saveRatchet(myHash, otherHash, session);
        } catch (de: any) {
          console.error(
            "[Chat] DM decrypt failed:",
            de.message,
            "- Check if ratchet state was properly restored from backup"
          );
          console.warn(
            "[Chat] Failed to decrypt message from",
            otherHash.slice(0, 8),
            "- Message will be skipped"
          );
          return;
        }
      } else {
        if (!deviceEnvelope) return;
        plaintext = env.message || "[Sent from another device]";
      }

      const local: LocalMessage = {
        _id: localMessageId,
        chatId: otherHash,
        ownerHash: myHash,
        senderEmailHash: senderHash,
        recipientEmailHash: recipientHash,
        message: plaintext,
        timestamp: env.createdAt ? new Date(env.createdAt).getTime() : Date.now(),
      };
      await storageUtil.saveMessage(local);

      
      
      
      if (!dmSyncInProgressRef.current) {
        emitDMActivity(otherHash, local.timestamp);
        setDMs((prev) => {
          const idx = prev.findIndex((d) => d.otherHash === otherHash);
          let next: DMSummary[];
          if (idx === -1) {
            next = [{ otherHash, contentTopic: `chat-${[myHash, otherHash].sort().join("-")}`, lastMessage: local }, ...prev];
          } else {
            next = prev.slice();
            next[idx] = { ...next[idx], lastMessage: local };
          }
          next.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
          return next;
        });
      }

      const sel = selectedChatRef.current;
      if (sel?.type === "dm" && sel.otherHash === otherHash) {
        const pendingToReplace =
          senderHash === myHash ? takePendingDM(myHash, otherHash, local.message) : null;
        setMessages((prev) => reconcileConfirmedMessage(prev, local, pendingToReplace));
      }
      scheduleVaultBackup();
    },
    [emailHash, deviceId, deviceKeypair, scheduleVaultBackup, takePendingDM, shouldHideForFreshStart]
  );



  const resolveRatchetForSender = useCallback(
    async (otherHash: string, envelope: GroupKeyEnvelope) => {
      if (!emailHash) return null;
      const myHash = emailHash.toLowerCase();
      const other = otherHash.toLowerCase();
      const idKp = getIdentityKeypair(myHash);
      if (!idKp) return null;
      if (envelope.aliceIdentityKey && envelope.aliceEphemeralKey) {
        const sharedSecret = respondX3DH(
          idKp,
          envelope.aliceIdentityKey,
          envelope.aliceEphemeralKey,
          envelope.usedSignedPrekey || encodeBase64(idKp.encryption.publicKey),
          envelope.usedOneTimePrekeyId
        );
        return initiateSessionAsResponder(
          idKp.encryption.secretKey,
          envelope.aliceIdentityKey,
          sharedSecret
        );
      }

      const session = loadRatchet(myHash, other);
      if (session) return session;
      return null;
    },
    [emailHash]
  );

  const requestGroupKeyDistribution = useCallback(
    async (groupId: string, keyId?: number) => {
      const headers = scopedHeaders();
      if (!headers) return;
      const BACKEND_URL = getBackendUrl();
      try {
        await axios.post(
          `${BACKEND_URL}/groups/${groupId}/key-needed`,
          typeof keyId === "number" ? { keyId } : {},
          { headers }
        );
      } catch (e: any) {
        console.warn("[Chat] group key request failed", e.message);
      }
    },
    [scopedHeaders]
  );

  const processKeyEnvelope = useCallback(
    async (env: any) => {
      if (!emailHash) return;
      if (shouldHideForFreshStart(env.createdAt)) return;
      const myHash = emailHash.toLowerCase();
      try {
        if (env.forDeviceId && deviceId && String(env.forDeviceId) !== deviceId) return;
        const envelope: GroupKeyEnvelope = env.encryptedPayload;
        const fromHash = (env.fromEmailHash || "").toLowerCase();
        let groupKey: string | null = null;

        if ((envelope as any)?.scheme === "device-box-v1" && deviceKeypair) {
          const plaintext = decryptFromDevice(envelope as any, deviceKeypair);
          groupKey = JSON.parse(plaintext).groupKey;
        } else {
          if (!envelope?.header?.dh || !envelope.ciphertext || !envelope.nonce) {
            console.warn("[Chat] skipped malformed group key envelope", {
              groupId: env.groupId,
              keyId: env.keyId,
              forDeviceId: env.forDeviceId,
            });
            requestGroupKeyDistribution(String(env.groupId), env.keyId).catch(() => {});
            return;
          }
          const ratchet = await resolveRatchetForSender(fromHash, envelope);
          if (!ratchet) return;
          groupKey = unwrapGroupKey(envelope, ratchet);
          if (!envelope.aliceIdentityKey || !envelope.aliceEphemeralKey) {
            if (ratchet.handshake) delete ratchet.handshake;
            saveRatchet(myHash, fromHash, ratchet);
          }
        }
        if (!groupKey) return;

        await storageUtil.saveGroupKey({
          key: `${myHash}:${env.groupId}:${env.keyId}`,
          ownerHash: myHash,
          groupId: String(env.groupId),
          keyId: env.keyId,
          groupKey,
          createdAt: env.createdAt ? new Date(env.createdAt).getTime() : Date.now(),
        });

        await rehydrateGroupMessagesForKey(String(env.groupId), env.keyId);
        scheduleVaultBackup();


        const BACKEND_URL = getBackendUrl();
        const headers = scopedHeaders();
        if (headers && env._id) {
          axios
            .post(
              `${BACKEND_URL}/group-key-distribution/ack`,
              { ids: [env._id] },
              { headers }
            )
            .catch((e) => console.warn("[Chat] ack key failed", e.message));
        }
      } catch (e: any) {
        console.error("[Chat] processKeyEnvelope failed", e.message);
        if (env?.groupId && typeof env.keyId === "number") {
          requestGroupKeyDistribution(String(env.groupId), env.keyId).catch(() => {});
        }
      }
    },
    [emailHash, shouldHideForFreshStart, rehydrateGroupMessagesForKey, resolveRatchetForSender, scopedHeaders, deviceId, deviceKeypair, requestGroupKeyDistribution, scheduleVaultBackup]
  );

  const fetchAndStoreKeyEnvelopes = useCallback(async () => {
    const headers = scopedHeaders();
    if (!headers) return;
    const BACKEND_URL = getBackendUrl();
    try {
      const res = await axios.get(`${BACKEND_URL}/group-key-distribution/sync`, {
        params: { limit: 1000 },
        headers,
      });
      for (const env of res.data.envelopes || []) {
        await processKeyEnvelope(env);
      }
    } catch (e: any) {
      console.error("[Chat] fetch key envelopes failed", e.message);
    }
  }, [scopedHeaders, processKeyEnvelope]);



  const handleIncomingGroupMessage = useCallback(
    async (env: any) => {
      if (!emailHash) return;
      if (shouldHideForFreshStart(env.createdAt)) return;
      const myHash = emailHash.toLowerCase();
      const groupId = String(env.groupId);

      const existing = await storageUtil.getGroupMessage(String(env._id));

      if (env.messageType === "system") {
        const systemLocal: LocalGroupMessage = {
          _id: String(env._id),
          ownerHash: myHash,
          groupId,
          senderEmailHash: (env.senderEmailHash || "").toLowerCase(),
          message: "",
          timestamp: env.createdAt ? new Date(env.createdAt).getTime() : Date.now(),
          messageType: "system",
          systemPayload: env.systemPayload,
        };
        await storageUtil.saveGroupMessage(systemLocal);
        setGroups((prev) =>
          prev.map((g) =>
            g._id === groupId
              ? { ...g, updatedAt: new Date(systemLocal.timestamp).toISOString() }
              : g
          )
        );
        const sel = selectedChatRef.current;
        if (sel?.type === "group" && sel.groupId === groupId) {
          setGroupMessages((prev) => upsertById(prev, systemLocal));
        }
        return;
      }

      if (existing) {
        if (GROUP_KEY_PLACEHOLDERS.has(existing.message)) {
          const keyEntry = await storageUtil.getGroupKey(myHash, groupId, env.keyId);
          if (keyEntry) {
            try {
              const plaintext = decryptGroupMessage(keyEntry.groupKey, env.ciphertext, env.nonce);
              const updated: LocalGroupMessage = {
                ...existing,
                message: plaintext,
                timestamp: env.createdAt ? new Date(env.createdAt).getTime() : existing.timestamp,
              };
              await storageUtil.saveGroupMessage(updated);
              const sel = selectedChatRef.current;
              if (sel?.type === "group" && sel.groupId === groupId) {
                setGroupMessages((prev) => upsertById(prev, updated));
              }
              return;
            } catch (e: any) {
              console.error("[Chat] group message re-decrypt failed", e.message);
            }
          }
        }
        const sel = selectedChatRef.current;
        if (sel?.type === "group" && sel.groupId === groupId) {
          const pendingToReplace =
            existing.senderEmailHash.toLowerCase() === myHash
              ? takePendingGroupMessage(myHash, groupId, existing.message)
              : null;
          setGroupMessages((prev) =>
            reconcileConfirmedMessage(prev, existing, pendingToReplace)
          );
        }
        return;
      }

      const keyEntry = await storageUtil.getGroupKey(myHash, groupId, env.keyId);
      let plaintext = "[No group key]";
      if (keyEntry) {
        try {
          plaintext = decryptGroupMessage(keyEntry.groupKey, env.ciphertext, env.nonce);
        } catch (e: any) {
          plaintext = "[Decryption Failed]";
        }
      } else {
        fetchAndStoreKeyEnvelopes().catch(() => {});
        requestGroupKeyDistribution(groupId, env.keyId).catch(() => {});
        return;
      }

      const local: LocalGroupMessage = {
        _id: String(env._id),
        ownerHash: myHash,
        groupId,
        senderEmailHash: (env.senderEmailHash || "").toLowerCase(),
        message: plaintext,
        timestamp: env.createdAt ? new Date(env.createdAt).getTime() : Date.now(),
      };
      await storageUtil.saveGroupMessage(local);

      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId ? { ...g, updatedAt: new Date(local.timestamp).toISOString() } : g
        )
      );

      const sel = selectedChatRef.current;
      if (sel?.type === "group" && sel.groupId === groupId) {
        const pendingToReplace =
          local.senderEmailHash.toLowerCase() === myHash
            ? takePendingGroupMessage(myHash, groupId, local.message)
            : null;
        setGroupMessages((prev) =>
          reconcileConfirmedMessage(prev, local, pendingToReplace)
        );
      }
    },
    [emailHash, fetchAndStoreKeyEnvelopes, requestGroupKeyDistribution, takePendingGroupMessage, shouldHideForFreshStart]
  );



  const drain = useCallback(async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      while (processingQueue.current.length > 0) {
        const job = processingQueue.current.shift();
        if (!job) continue;
        try {
          if (job.type === "dm") await handleIncomingDM(job.payload);
          else if (job.type === "group") await handleIncomingGroupMessage(job.payload);
          else if (job.type === "key") await processKeyEnvelope(job.payload);
        } catch (e) {
          console.error("[Chat] queue job failed", e);
        }
      }
    } finally {
      isProcessing.current = false;
    }
  }, [handleIncomingDM, handleIncomingGroupMessage, processKeyEnvelope]);

  const enqueue = useCallback(
    (type: "dm" | "group" | "key", payload: any) => {
      processingQueue.current.push({ type, payload });
      drain();
    },
    [drain]
  );



  const mergeGroups = useCallback((current: GroupDoc[], incoming: GroupDoc[]) => {
    const map = new Map(current.map((g) => [g._id, g]));
    for (const group of incoming) map.set(group._id, group);
    return Array.from(map.values());
  }, []);

  const refreshGroups = useCallback(async (opts?: { reset?: boolean; limit?: number }) => {
    const headers = scopedHeaders();
    if (!headers) return;
    const BACKEND_URL = getBackendUrl();
    try {
      setGroupsLoading(true);
      const limit = opts?.limit ?? 10;
      const offset = opts?.reset === false ? groupsRef.current.length : 0;
      const res = await axios.get(`${BACKEND_URL}/groups`, {
        params: { limit, offset },
        headers,
      });
      const incoming = res.data.groups || [];
      setGroups((prev) => (offset === 0 ? incoming : mergeGroups(prev, incoming)));
      setGroupsHasMore(!!res.data.hasMore);
    } catch (e: any) {
      console.error("[Chat] refreshGroups failed", e.message);
    } finally {
      setGroupsLoading(false);
    }
  }, [scopedHeaders, mergeGroups]);

  const loadMoreGroups = useCallback(async () => {
    if (groupsLoading || !groupsHasMore) return;
    await refreshGroups({ reset: false, limit: 10 });
  }, [groupsLoading, groupsHasMore, refreshGroups]);

  
  const dmsRefreshInProgressRef = useRef(false);

  const refreshDMs = useCallback(async () => {
    const headers = scopedHeaders();
    if (!headers || !emailHash) return;
    
    if (dmsRefreshInProgressRef.current) return;
    dmsRefreshInProgressRef.current = true;
    
    const BACKEND_URL = getBackendUrl();
    try {
      
      const isInitialLoad = dms.length === 0;
      if (isInitialLoad) {
        setDmsLoading(true);
      }
      
      
      
      dmSyncInProgressRef.current = true;
      dmSyncBufferRef.current = [];

      const res = await axios.get(`${BACKEND_URL}/chat/sync`, {
        params: { limit: 50 },
        headers,
      });
      const deletedPeers = Array.isArray(res.data.deletedPeers) ? res.data.deletedPeers : [];
      await Promise.all(
        deletedPeers
          .map((entry: any) => ({
            peerHash: String(entry?.peerHash || "").toLowerCase(),
            reason: String(entry?.reason || "deleted"),
            deletedAt: entry?.deletedAt || null,
          }))
          .filter((entry: any) => entry.peerHash)
          .map((entry: any) =>
            purgeDeletedDMPeer(entry.peerHash, {
              markDeleted: entry.reason !== "blocked",
              deletedAt: entry.deletedAt,
            })
          )
      );
      
      
      for (const env of res.data.messages || []) {
        enqueue("dm", env);
      }

      
      
      while (isProcessing.current || processingQueue.current.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      
      const all = await storageUtil.getAllMessagesForOwner(emailHash.toLowerCase());
      const visible = filterLocalHistoryForFreshStart(all);
      const byOther = new Map<string, LocalMessage>();
      for (const m of visible) {
        const existing = byOther.get(m.chatId);
        if (!existing || existing.timestamp < m.timestamp) byOther.set(m.chatId, m);
      }
      const summaries: DMSummary[] = Array.from(byOther.entries()).map(([otherHash, last]) => ({
        otherHash,
        contentTopic: `chat-${[emailHash.toLowerCase(), otherHash].sort().join("-")}`,
        lastMessage: last,
      }));
      summaries.sort(
        (a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
      );
      setDMs(summaries);

      
      dmSyncInProgressRef.current = false;
      const buffered = dmSyncBufferRef.current.splice(0);
      for (const env of buffered) enqueue("dm", env);
    } catch (e: any) {
      setError(e.message);
      dmSyncInProgressRef.current = false;
    } finally {
      setDmsLoading(false);
      dmsRefreshInProgressRef.current = false;
    }
  }, [scopedHeaders, emailHash, enqueue, purgeDeletedDMPeer, dms.length, shouldHideForFreshStart, filterLocalHistoryForFreshStart]);



  const ensureRatchetForRecipient = useCallback(
    async (recipientHash: string): Promise<RatchetState> => {
      if (!emailHash || !token) throw new Error("Not authenticated");
      const myHash = emailHash.toLowerCase();
      const other = recipientHash.toLowerCase();
      let session = loadRatchet(myHash, other);
      if (session) return session;

      const idKp = await ensureLocalIdentityKeypair(myHash);
      if (!idKp) throw new Error("Missing identity keypair");

      const bundle = await fetchPrekeyBundle(other);
      const { sharedSecret, ephemeralPublicKey, usedSignedPrekey, usedOneTimePrekeyId } =
        initiateX3DH(idKp, bundle);
      session = initiateSessionAsInitiator(idKp.encryption.secretKey, bundle.identityKey, sharedSecret);
      session.handshake = {
        aliceIdentityKey: encodeBase64(idKp.encryption.publicKey),
        aliceEphemeralKey: ephemeralPublicKey,
        usedSignedPrekey,
        usedOneTimePrekeyId,
      };
      return session;
    },
    [emailHash, token, ensureLocalIdentityKeypair, fetchPrekeyBundle]
  );

  const sendDirectMessage = useCallback(
    async (recipientHash: string, content: string, opts?: SendOpts) => {
      if (!token || !emailHash) return;
      const BACKEND_URL = getBackendUrl();
      const myHash = emailHash.toLowerCase();
      const other = recipientHash.toLowerCase();
      const pendingId = dmLocalId(myHash, `pending-${Date.now()}-${Math.random().toString(16).slice(2)}`);
      const pending: LocalMessage = {
        _id: pendingId,
        chatId: other,
        ownerHash: myHash,
        senderEmailHash: myHash,
        recipientEmailHash: other,
        message: content,
        timestamp: Date.now(),
      };
      const upsertSummary = (msg: LocalMessage) => {
        setDMs((prev) => {
          const idx = prev.findIndex((d) => d.otherHash === other);
          let next: DMSummary[];
          if (idx === -1) {
            next = [{ otherHash: other, contentTopic: `chat-${[myHash, other].sort().join("-")}`, lastMessage: msg }, ...prev];
          } else {
            next = prev.slice();
            next[idx] = { ...next[idx], lastMessage: msg };
          }
          next.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
          return next;
        });
      };
      try {
        const totalStartedAt = perfNow();
        setLoading(true);
        rememberPendingDM(myHash, other, content, pendingId);
        setMessages((prev) => (prev.some((m) => m._id === pendingId) ? prev : [...prev, pending]));
        upsertSummary(pending);
        emitDMActivity(other, pending.timestamp);
        const ratchetStartedAt = perfNow();
        const session = await ensureRatchetForRecipient(other);
        const { ciphertext, nonce, header } = encryptRatchet(session, content);
        saveRatchet(myHash, other, session);
        logPerf("dm ratchet encrypt", ratchetStartedAt, 75);
        const envelopes: any[] = [];
        if (deviceKeypair) {
          const deviceStartedAt = perfNow();
          const targets = new Map<string, { forEmailHash: string; publicKey: string }>();
          await Promise.all(
            [other, myHash].map(async (hash) => {
              try {
                const devices =
                  hash === myHash
                    ? (await listDevicesForIdentity(hash)).filter((device: any) => device.status === "active")
                    : await getCachedDevicesForIdentity(hash);
                for (const d of devices) {
                  if (!d.publicKey) continue;
                  targets.set(`${hash}:${d.deviceId}`, { forEmailHash: hash, publicKey: d.publicKey });
                }
              } catch (e: any) {
                console.warn(`[Chat] device lookup failed for ${hash.slice(0, 8)}`, e.message);
              }
            })
          );
          logPerf("dm device lookup", deviceStartedAt, 100);
          for (const [key, target] of targets) {
            const [, forDeviceId] = key.split(":");
            envelopes.push({
              forEmailHash: target.forEmailHash,
              forDeviceId,
              encryptedPayload: encryptForDevice(content, target.publicKey, deviceKeypair),
            });
          }
        }

        const payload = {
          recipientEmailHash: other,
          encryptedPayload: {
            ciphertext,
            nonce,
            header,
            ...(session.handshake || {}),
          },
          envelopes,
          contentTopic: `chat-${[myHash, other].sort().join("-")}`,
          messageType: opts?.messageType || "text",
          pointMeta:
            (opts?.messageType || "text") === "text"
              ? await buildPointMeta(content, `dm:${[myHash, other].sort().join(":")}`)
              : undefined,
        };
        const postStartedAt = perfNow();
        const res = await axios.post(`${BACKEND_URL}/chat/send`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        logPerf("dm post", postStartedAt, 150);

        const serverMessageId = res.data.id ? String(res.data.id) : `local-${Date.now()}`;
        const local: LocalMessage = {
          _id: dmLocalId(myHash, serverMessageId),
          chatId: other,
          ownerHash: myHash,
          senderEmailHash: myHash,
          recipientEmailHash: other,
          message: content,
          timestamp: Date.now(),
        };
        const saveStartedAt = perfNow();
        await storageUtil.saveMessage(local);
        logPerf("dm local save", saveStartedAt, 75);
        forgetPendingDM(myHash, other, content, pendingId);
        setMessages((prev) => {
          return reconcileConfirmedMessage(prev, local, pendingId);
        });
        upsertSummary(local);
        emitDMActivity(other, local.timestamp);
        notifyPointsMayHaveChanged();
        scheduleVaultBackup();
        logPerf("dm send total", totalStartedAt, 200);
      } catch (e: any) {
        forgetPendingDM(myHash, other, content, pendingId);
        setMessages((prev) => prev.filter((m) => m._id !== pendingId));
        const history = await storageUtil.getChatHistory(myHash, other).catch(() => []);
        const previous = history[history.length - 1];
        setDMs((prev) => {
          const idx = prev.findIndex((d) => d.otherHash === other);
          if (idx === -1) return prev;
          if (!previous) return prev.filter((d) => d.otherHash !== other);
          const next = prev.slice();
          next[idx] = { ...next[idx], lastMessage: previous };
          return next;
        });
        setError(e.message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [token, emailHash, ensureRatchetForRecipient, deviceKeypair, getCachedDevicesForIdentity, listDevicesForIdentity, scheduleVaultBackup, rememberPendingDM, forgetPendingDM]
  );

  const buildKeyEnvelopes = useCallback(
    async (groupId: string, keyId: number, groupKey: string, memberHashes: string[]) => {
      if (!emailHash || !token) return [];
      const myHash = emailHash.toLowerCase();
      const startedAt = perfNow();
      const results = await Promise.all(memberHashes.map(async (hash) => {
        const other = hash.toLowerCase();
        const envelopes: {
          forEmailHash: string;
          forDeviceId?: string;
          keyId: number;
          encryptedPayload: GroupKeyEnvelope | any;
        }[] = [];
        try {
          let sentDeviceEnvelope = false;
          if (deviceKeypair) {
            const devices = await getCachedDevicesForIdentity(other).catch(() => []);
            for (const device of devices) {
              if (!device.publicKey) continue;
              envelopes.push({
                forEmailHash: other,
                forDeviceId: device.deviceId,
                keyId,
                encryptedPayload: encryptForDevice(
                  JSON.stringify({ groupKey }),
                  device.publicKey,
                  deviceKeypair
                ) as any,
              });
              sentDeviceEnvelope = true;
            }
          }
          if (sentDeviceEnvelope) return envelopes;
          if (other === myHash) return envelopes;
          const idKp = await ensureLocalIdentityKeypair(myHash);
          if (!idKp) throw new Error("Missing identity keypair");
          const bundle = await fetchPrekeyBundle(other);
          const { sharedSecret, ephemeralPublicKey, usedSignedPrekey, usedOneTimePrekeyId } =
            initiateX3DH(idKp, bundle);
          const session = initiateSessionAsInitiator(
            idKp.encryption.secretKey,
            bundle.identityKey,
            sharedSecret
          );
          session.handshake = {
            aliceIdentityKey: encodeBase64(idKp.encryption.publicKey),
            aliceEphemeralKey: ephemeralPublicKey,
            usedSignedPrekey,
            usedOneTimePrekeyId,
          };
          const envelope = wrapGroupKeyForMember(groupKey, session);
          envelopes.push({ forEmailHash: other, keyId, encryptedPayload: envelope });
        } catch (e: any) {
          console.error(`[Chat] wrap key for ${other} failed:`, e.message);
        }
        return envelopes;
      }));
      const envelopes = results.flat();
      logPerf(`group key envelopes ${memberHashes.length}`, startedAt, 250);

      await storageUtil.saveGroupKey({
        key: `${myHash}:${groupId}:${keyId}`,
        ownerHash: myHash,
        groupId,
        keyId,
        groupKey,
        createdAt: Date.now(),
      });
      return envelopes;
    },
    [emailHash, token, deviceKeypair, getCachedDevicesForIdentity, ensureLocalIdentityKeypair, fetchPrekeyBundle]
  );

  const refreshActiveSocketRooms = useCallback(() => {
    const sock = socketRef.current;
    if (!sock || !emailHash) return;
    sock.emit("subprofile:switch", { identityHash: emailHash.toLowerCase() });
  }, [emailHash]);

  const createGroup = useCallback(
    async (
      name: string,
      memberHashes: string[],
      opts?: { description?: string; avatarId?: number; isPublic?: boolean }
    ): Promise<GroupDoc> => {
      if (!token || !emailHash) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();
      setLoading(true);
      try {
        const hashes = Array.from(
          new Set(memberHashes.map((h) => h.toLowerCase()).filter((h) => h !== emailHash.toLowerCase()))
        );
        const res = await axios.post(
          `${BACKEND_URL}/groups`,
          { name, memberHashes: hashes, ...(opts || {}) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const group: GroupDoc = res.data.group;
        const groupId = String(group._id);
        const groupKey = generateGroupKey();
        const keyId = group.currentKeyId;
        const envelopes = await buildKeyEnvelopes(groupId, keyId, groupKey, group.members.map((m) => m.emailHash));
        if (envelopes.length > 0) {
          await axios.post(
            `${BACKEND_URL}/groups/${groupId}/key-distribution`,
            { envelopes },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        setGroups((prev) => (prev.some((g) => g._id === group._id) ? prev : [group, ...prev]));
        refreshActiveSocketRooms();
        scheduleVaultBackup();
        return group;
      } finally {
        setLoading(false);
      }
    },
    [token, emailHash, buildKeyEnvelopes, refreshActiveSocketRooms, scheduleVaultBackup]
  );

  const addGroupMember = useCallback(
    async (groupId: string, newMemberHash: string) => {
      if (!token || !emailHash) return;
      const BACKEND_URL = getBackendUrl();
      const res = await axios.post(
        `${BACKEND_URL}/groups/${groupId}/members`,
        { emailHash: newMemberHash.toLowerCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const group: GroupDoc = res.data.group;
      const newKeyId: number = res.data.newKeyId;
      const otherHashes = group.members.map((m) => m.emailHash);
      const groupKey = generateGroupKey();
      const envelopes = await buildKeyEnvelopes(String(group._id), newKeyId, groupKey, otherHashes);
      if (envelopes.length > 0) {
        await axios.post(
          `${BACKEND_URL}/groups/${group._id}/key-distribution`,
          { envelopes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setGroups((prev) => prev.map((g) => (g._id === group._id ? group : g)));
      refreshActiveSocketRooms();
      scheduleVaultBackup();
    },
    [token, emailHash, buildKeyEnvelopes, refreshActiveSocketRooms, scheduleVaultBackup]
  );

  const removeGroupMember = useCallback(
    async (groupId: string, memberHash: string) => {
      if (!token || !emailHash) return;
      const BACKEND_URL = getBackendUrl();
      const res = await axios.delete(
        `${BACKEND_URL}/groups/${groupId}/members/${memberHash.toLowerCase()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const group: GroupDoc = res.data.group;
      const newKeyId: number = res.data.newKeyId;
      const otherHashes = group.members.map((m) => m.emailHash);
      const groupKey = generateGroupKey();
      const envelopes = await buildKeyEnvelopes(String(group._id), newKeyId, groupKey, otherHashes);
      if (envelopes.length > 0) {
        await axios.post(
          `${BACKEND_URL}/groups/${group._id}/key-distribution`,
          { envelopes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setGroups((prev) => prev.map((g) => (g._id === group._id ? group : g)));
      scheduleVaultBackup();
    },
    [token, emailHash, buildKeyEnvelopes, scheduleVaultBackup]
  );

  const promoteGroupAdmin = useCallback(
    async (groupId: string, memberHash: string) => {
      if (!token) return;
      const BACKEND_URL = getBackendUrl();
      const res = await axios.post(
        `${BACKEND_URL}/groups/${groupId}/admin/${memberHash.toLowerCase()}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const group: GroupDoc = res.data.group;

      setGroups((prev) => prev.map((g) => (g._id === group._id ? group : g)));
    },
    [token]
  );

  const demoteGroupAdmin = useCallback(
    async (groupId: string, memberHash: string) => {
      if (!token) return;
      const BACKEND_URL = getBackendUrl();
      const res = await axios.delete(
        `${BACKEND_URL}/groups/${groupId}/admin/${memberHash.toLowerCase()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const group: GroupDoc = res.data.group;
      setGroups((prev) => prev.map((g) => (g._id === group._id ? group : g)));
    },
    [token]
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!token) return;
      const BACKEND_URL = getBackendUrl();
      await axios.delete(`${BACKEND_URL}/groups/${groupId}/leave`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      setGroupMessages((prev) => prev.filter((m) => m.groupId !== groupId));
      setSelectedChatState((prev) =>
        prev?.type === "group" && prev.groupId === groupId ? null : prev
      );
      if (emailHash) await storageUtil.clearGroup(emailHash.toLowerCase(), groupId);
    },
    [token, emailHash]
  );

  const sendGroupMessage = useCallback(
    async (groupId: string, content: string, opts?: SendOpts) => {
      if (!token || !emailHash) return;
      const myHash = emailHash.toLowerCase();
      const BACKEND_URL = getBackendUrl();
      let group = groups.find((g) => String(g._id) === groupId);
      if (!group) throw new Error("Group not loaded");
      let keyId = group.currentKeyId;
      let keyEntry = await storageUtil.getGroupKey(myHash, groupId, keyId);
      if (!keyEntry) {
        await fetchAndStoreKeyEnvelopes();
        keyEntry = await storageUtil.getGroupKey(myHash, groupId, keyId);
      }
      if (!keyEntry) {
        const latest = await storageUtil.getLatestGroupKey(myHash, groupId);
        if (latest) {
          keyEntry = latest;
          keyId = latest.keyId;
        }
      }
      if (!keyEntry) {
        const headers = scopedHeaders() || { Authorization: `Bearer ${token}` };
        const rotationRes = await axios.post(
          `${BACKEND_URL}/groups/${groupId}/key-rotation`,
          {},
          { headers }
        );
        const rotatedGroup: GroupDoc = rotationRes.data.group;
        const newKeyId: number = rotationRes.data.newKeyId;
        const groupKey = generateGroupKey();
        const memberHashes = rotatedGroup.members.map((member) => member.emailHash);
        const envelopes = await buildKeyEnvelopes(groupId, newKeyId, groupKey, memberHashes);
        if (envelopes.length > 0) {
          await axios.post(
            `${BACKEND_URL}/groups/${groupId}/key-distribution`,
            { envelopes },
            { headers }
          );
        }
        setGroups((prev) => prev.map((g) => (g._id === groupId ? rotatedGroup : g)));
        group = rotatedGroup;
        keyId = newKeyId;
        keyEntry = await storageUtil.getGroupKey(myHash, groupId, keyId);
      }
      if (!keyEntry) {
        await requestGroupKeyDistribution(groupId, keyId);
        throw new Error("Missing group key — requested distribution. Try again shortly.");
      }

      const totalStartedAt = perfNow();
      const pendingId = `local-group-pending-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const pending: LocalGroupMessage = {
        _id: pendingId,
        ownerHash: myHash,
        groupId,
        senderEmailHash: myHash,
        message: content,
        timestamp: Date.now(),
      };
      rememberPendingGroupMessage(myHash, groupId, content, pendingId);
      setGroupMessages((prev) => upsertById(prev, pending));
      try {
        const { ciphertext, nonce } = encryptGroupMessage(keyEntry.groupKey, content);
        const postStartedAt = perfNow();
        const res = await axios.post(
          `${BACKEND_URL}/groups/${groupId}/messages`,
          {
            keyId,
            ciphertext,
            nonce,
            messageType: opts?.messageType || "text",
            pointMeta:
              (opts?.messageType || "text") === "text"
                ? await buildPointMeta(content, `group:${groupId}`)
                : undefined,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        logPerf("group post", postStartedAt, 150);

        const local: LocalGroupMessage = {
          _id: res.data.id || `local-${Date.now()}`,
          ownerHash: myHash,
          groupId,
          senderEmailHash: myHash,
          message: content,
          timestamp: Date.now(),
        };
        const saveStartedAt = perfNow();
        await storageUtil.saveGroupMessage(local);
        logPerf("group local save", saveStartedAt, 75);
        forgetPendingGroupMessage(myHash, groupId, content, pendingId);
        setGroupMessages((prev) => reconcileConfirmedMessage(prev, local, pendingId));
        setGroups((prev) =>
          prev.map((g) =>
            g._id === groupId ? { ...g, updatedAt: new Date(local.timestamp).toISOString() } : g
          )
        );
        notifyPointsMayHaveChanged();
        scheduleVaultBackup();
        logPerf("group send total", totalStartedAt, 200);
      } catch (e) {
        forgetPendingGroupMessage(myHash, groupId, content, pendingId);
        setGroupMessages((prev) => prev.filter((m) => m._id !== pendingId));
        throw e;
      }
    },
    [token, emailHash, groups, scopedHeaders, fetchAndStoreKeyEnvelopes, requestGroupKeyDistribution, buildKeyEnvelopes, scheduleVaultBackup, rememberPendingGroupMessage, forgetPendingGroupMessage]
  );



  const previewProfile = useCallback(
    async (username: string): Promise<ProfilePreview | null> => {
      const BACKEND_URL = getBackendUrl();
      try {
        const res = await axios.get(
          `${BACKEND_URL}/profiles/${encodeURIComponent(username.trim().toLowerCase())}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        return res.data.profile as ProfilePreview;
      } catch (e: any) {
        if (e?.response?.status === 404) return null;
        console.error("[Chat] previewProfile failed", e.message);
        return null;
      }
    },
    [token]
  );

  const previewGroup = useCallback(
    async (shareToken: string): Promise<GroupDoc | null> => {
      const BACKEND_URL = getBackendUrl();
      try {
        const res = await axios.get(
          `${BACKEND_URL}/groups/share/${encodeURIComponent(shareToken)}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        return res.data.group as GroupDoc;
      } catch (e: any) {
        if (e?.response?.status === 404) return null;
        console.error("[Chat] previewGroup failed", e.message);
        return null;
      }
    },
    [token]
  );

  const joinGroupByShareToken = useCallback(
    async (
      shareToken: string,
      opts?: { identityHash?: string | null }
    ): Promise<JoinResult> => {
      if (!token) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();
      const pinnedIdentityHash = opts?.identityHash?.toLowerCase();
      const res = await axios.post(
        `${BACKEND_URL}/groups/share/${encodeURIComponent(shareToken)}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(pinnedIdentityHash ? { "X-Identity-Hash": pinnedIdentityHash } : {}),
          },
        }
      );
      const group: GroupDoc = res.data.group;
      if (group && res.data.status !== "requested") {
        setGroups((prev) => {
          const idx = prev.findIndex((g) => g._id === group._id);
          if (idx === -1) return [group, ...prev];
          const copy = [...prev];
          copy[idx] = group;
          return copy;
        });
        notifyPointsMayHaveChanged();
      }
      return {
        status: res.data.status,
        group,
        newKeyId: res.data.newKeyId,
      };
    },
    [token]
  );

  const updateGroup = useCallback(
    async (
      groupId: string,
      patch: { name?: string; description?: string; avatarId?: number; isPublic?: boolean }
    ): Promise<GroupDoc> => {
      if (!token) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();
      const res = await axios.patch(`${BACKEND_URL}/groups/${groupId}`, patch, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const group: GroupDoc = res.data.group;
      setGroups((prev) => prev.map((g) => (g._id === group._id ? group : g)));
      return group;
    },
    [token]
  );

  const manageGroupRequest = useCallback(
    async (groupId: string, requesterHash: string, action: "approve" | "reject"): Promise<GroupDoc> => {
      if (!token || !emailHash) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();
      const res = await axios.post(
        `${BACKEND_URL}/groups/${groupId}/requests/${encodeURIComponent(requesterHash.toLowerCase())}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const group: GroupDoc = res.data.group;
      const newKeyId: number | null = res.data.newKeyId ?? null;

      setGroups((prev) => prev.map((g) => (g._id === group._id ? group : g)));

      if (action === "approve" && newKeyId) {
        const myHash = emailHash.toLowerCase();
        const keyEntry = await storageUtil.getGroupKey(myHash, String(group._id), newKeyId);
        let groupKey = keyEntry?.groupKey;
        if (!groupKey) groupKey = generateGroupKey();
        const otherHashes = group.members.map((m) => m.emailHash);
        const envelopes = await buildKeyEnvelopes(
          String(group._id),
          newKeyId,
          groupKey,
          otherHashes
        );
        if (envelopes.length > 0) {
          await axios.post(
            `${BACKEND_URL}/groups/${group._id}/key-distribution`,
            { envelopes },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      scheduleVaultBackup();
      return group;
    },
    [token, emailHash, buildKeyEnvelopes, scheduleVaultBackup]
  );



  const markDirectRead = useCallback(
    async (peerHash: string, lastReadAt?: number) => {
      const headers = scopedHeaders();
      if (!headers) return;
      const BACKEND_URL = getBackendUrl();
      const peer = peerHash.toLowerCase();
      const ts = lastReadAt ?? Date.now();
      try {
        const res = await axios.post(
          `${BACKEND_URL}/chat/read`,
          { peerHash: peer, lastReadAt: new Date(ts).toISOString() },
          { headers }
        );
        const serverTs = res.data?.lastReadAt ? new Date(res.data.lastReadAt).getTime() : ts;
        setDmReadState((prev) => ({
          ...prev,
          mine: { ...prev.mine, [peer]: Math.max(prev.mine[peer] ?? 0, serverTs) },
        }));
      } catch (e: any) {
        console.error("[Chat] markDirectRead failed", e.message);
      }
    },
    [scopedHeaders]
  );

  const markGroupRead = useCallback(
    async (groupId: string, messageIds: string[]) => {
      const headers = scopedHeaders();
      if (!headers || !emailHash || messageIds.length === 0) return;
      const BACKEND_URL = getBackendUrl();
      const myHash = emailHash.toLowerCase();
      try {
        await axios.post(
          `${BACKEND_URL}/groups/${groupId}/read`,
          { ids: messageIds },
          { headers }
        );
        const readAt = Date.now();
        setGroupReads((prev) => {
          const next = { ...prev };
          for (const id of messageIds) {
            const existing = next[id] || [];
            if (!existing.some((e) => e.emailHash === myHash)) {
              next[id] = [...existing, { emailHash: myHash, readAt }];
            }
          }
          return next;
        });
      } catch (e: any) {
        console.error("[Chat] markGroupRead failed", e.message);
      }
    },
    [scopedHeaders, emailHash]
  );

  const refreshReadState = useCallback(async () => {
    const headers = scopedHeaders();
    if (!headers) return;
    const BACKEND_URL = getBackendUrl();
    try {
      const res = await axios.get(`${BACKEND_URL}/chat/read-state`, {
        headers,
      });
      const mine: Record<string, number> = {};
      const theirs: Record<string, number> = {};
      for (const r of res.data?.mine || []) {
        if (r.peerHash && r.lastReadAt) mine[r.peerHash] = new Date(r.lastReadAt).getTime();
      }
      for (const r of res.data?.theirs || []) {
        if (r.ownerHash && r.lastReadAt) theirs[r.ownerHash] = new Date(r.lastReadAt).getTime();
      }
      setDmReadState({ mine, theirs });
    } catch (e: any) {
      console.error("[Chat] refreshReadState failed", e.message);
    }
  }, [scopedHeaders]);

  




  const markGroupOpened = useCallback(
    async (groupId: string, when?: number) => {
      const headers = scopedHeaders();
      if (!headers || !groupId) return;
      const ts = when ?? Date.now();
      
      setGroupOpenedAt((prev) => ({
        ...prev,
        [groupId]: Math.max(prev[groupId] || 0, ts),
      }));
      const BACKEND_URL = getBackendUrl();
      try {
        const res = await axios.post(
          `${BACKEND_URL}/groups/${groupId}/opened`,
          { lastOpenedAt: new Date(ts).toISOString() },
          { headers }
        );
        const serverTs = res.data?.lastOpenedAt
          ? new Date(res.data.lastOpenedAt).getTime()
          : ts;
        setGroupOpenedAt((prev) => ({
          ...prev,
          [groupId]: Math.max(prev[groupId] || 0, serverTs),
        }));
      } catch (e: any) {
        console.error("[Chat] markGroupOpened failed", e.message);
      }
    },
    [scopedHeaders]
  );

  




  const refreshGroupOpenedState = useCallback(async () => {
    const headers = scopedHeaders();
    if (!headers) return;
    const BACKEND_URL = getBackendUrl();
    try {
      const res = await axios.get(`${BACKEND_URL}/groups/opened-state`, {
        headers,
      });
      const next: Record<string, number> = {};
      for (const r of res.data?.receipts || []) {
        if (r.groupId && r.lastOpenedAt) {
          next[r.groupId] = new Date(r.lastOpenedAt).getTime();
        }
      }
      setGroupOpenedAt(next);
    } catch (e: any) {
      console.error("[Chat] refreshGroupOpenedState failed", e.message);
    }
  }, [scopedHeaders]);



  const sendAttachment = useCallback(
    async (target: AttachmentTarget, file: File, caption?: string) => {
      if (!token || !emailHash) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();
      const myHash = emailHash.toLowerCase();

      const encrypted = await encryptFileBytes(file);
      const blob = new Blob([encrypted.ciphertext as BlobPart], { type: "application/octet-stream" });
      const uploadFile = new File([blob], `${file.name}.enc`, { type: "application/octet-stream" });

      const form = new FormData();
      form.append("file", uploadFile);
      form.append("ownerHash", myHash);
      if (target.type === "dm") {
        const topic = `chat-${[myHash, target.otherHash.toLowerCase()].sort().join("-")}`;
        form.append("contentTopic", topic);
        form.append("type", "dm");
      } else {
        form.append("groupId", target.groupId);
        form.append("type", "group");
      }

      const uploadRes = await axios.post(`${BACKEND_URL}/file/upload`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const doc = uploadRes.data?.data || uploadRes.data?.file || uploadRes.data || {};
      const meta: AttachmentMeta = {
        kind: "attachment",
        url: doc.url,
        name: file.name,
        size: file.size,
        mime: file.type,
        caption,
        key: encrypted.key,
        nonce: encrypted.nonce,
      };
      if (!meta.url) throw new Error("Upload returned no URL");

      const payload = JSON.stringify(meta);
      if (target.type === "dm") {
        await sendDirectMessage(target.otherHash, payload, { messageType: "file" });
      } else {
        await sendGroupMessage(target.groupId, payload, { messageType: "file" });
      }
    },
    [token, emailHash, sendDirectMessage, sendGroupMessage]
  );



  const startTyping = useCallback(
    (target: { type: "dm" | "group"; chatId: string }) => {
      const sock = socketRef.current;
      if (!sock) return;
      const key = `${target.type}:${target.chatId}`;
      if (!typingEmitTimers.current[key]) {
        sock.emit("typing:start", { type: target.type, chatId: target.chatId });
      } else {
        clearTimeout(typingEmitTimers.current[key]);
      }
      typingEmitTimers.current[key] = setTimeout(() => {
        sock.emit("typing:stop", { type: target.type, chatId: target.chatId });
        delete typingEmitTimers.current[key];
      }, 4000);
    },
    []
  );

  const stopTyping = useCallback(
    (target: { type: "dm" | "group"; chatId: string }) => {
      const sock = socketRef.current;
      if (!sock) return;
      const key = `${target.type}:${target.chatId}`;
      if (typingEmitTimers.current[key]) {
        clearTimeout(typingEmitTimers.current[key]);
        delete typingEmitTimers.current[key];
      }
      sock.emit("typing:stop", { type: target.type, chatId: target.chatId });
    },
    []
  );

  const scheduleTypingExpiry = useCallback((chatKey: ChatKey, emailHash: string) => {
    const tKey = `${chatKey}|${emailHash}`;
    if (typingExpireTimers.current[tKey]) clearTimeout(typingExpireTimers.current[tKey]);
    typingExpireTimers.current[tKey] = setTimeout(() => {
      setTypingPeers((prev) => {
        const list = prev[chatKey];
        if (!list) return prev;
        const next = list.filter((h) => h !== emailHash);
        if (next.length === list.length) return prev;
        return { ...prev, [chatKey]: next };
      });
      delete typingExpireTimers.current[tKey];
    }, 6000);
  }, []);



  useEffect(() => {
    if (!isConnected || !token || !emailHash) return;
    const BACKEND_URL = getBackendUrl();
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    const activeHash = emailHash.toLowerCase();
    const socket = io(BACKEND_URL, {
      auth: { token, identityHash: activeHash },
      extraHeaders: { "X-Identity-Hash": activeHash },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    
    
    let lastConnectSyncAt = 0;

    socket.on("connect", async () => {
      // Always re-join the correct sub-profile room on every connect/reconnect,
      // even if the 30 s data-sync throttle fires. Without this, a second
      // device (QR-scanned / phrase-restored) could miss the room join on rapid
      // reconnects and stop receiving real-time dm:new events.
      refreshActiveSocketRooms();

      const now = Date.now();
      if (now - lastConnectSyncAt < 30_000) return;
      lastConnectSyncAt = now;

      await fetchAndStoreKeyEnvelopes();
      await refreshGroups();
      await refreshDMs();



      refreshReadState().catch(() => {});
      refreshGroupOpenedState().catch(() => {});
    });

    socket.on("dm:new", (env: any) => {
      const myHash = emailHash.toLowerCase();
      const senderHash = String(env?.senderEmailHash || "").toLowerCase();
      const recipientHash = String(env?.recipientEmailHash || "").toLowerCase();

      // Check whether this event is for the currently active sub-profile.
      // The socket passively joins rooms for ALL owned sub-profile identities
      // (so the backend can deliver messages even when a profile is not active),
      // but we must NOT process a message as if it belongs to the active profile
      // when it was actually addressed to a different identity.
      const isForActiveProfile = senderHash === myHash || recipientHash === myHash;

      if (!isForActiveProfile) {
        // The message is for a passive (currently inactive) sub-profile.
        // Fire a lightweight custom event so notification badges can be updated;
        // the full message will be fetched and decrypted correctly when the user
        // switches to that sub-profile and refreshDMs runs.
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("chat:passive-dm", { detail: { env, identityHash: recipientHash } })
          );
        }
        return;
      }

      if (dmSyncInProgressRef.current) {
        dmSyncBufferRef.current.push(env);
      } else {
        enqueue("dm", env);
      }
    });
    socket.on("dm:peer-deleted", (payload: any) => {
      const peerHash = String(payload?.peerHash || "").toLowerCase();
      if (peerHash) {
        purgeDeletedDMPeer(peerHash, {
          markDeleted: String(payload?.reason || "deleted") !== "blocked",
          deletedAt: payload?.deletedAt || null,
        }).catch(() => {});
      }
    });
    socket.on("group:new", (env: any) => enqueue("group", env));
    socket.on("group:key", (env: any) => enqueue("key", env));
    socket.on("group:member:added", ({ group, newMember }: any) => {
      if (group) setGroups((prev) => {
        const idx = prev.findIndex((g) => g._id === group._id);
        if (idx === -1) return [group, ...prev];
        const copy = [...prev];
        copy[idx] = group;
        return copy;
      });
      const myHash = emailHash.toLowerCase();
      if (group?._id && newMember?.toLowerCase() === myHash) {
        storageUtil.clearGroup(myHash, group._id).catch(() => {});
        setGroupMessages((prev) => prev.filter((m) => m.groupId !== group._id));
      }
      fetchAndStoreKeyEnvelopes().catch(() => {});
      refreshActiveSocketRooms();
    });
    socket.on("group:member:removed", ({ group, groupId, removed, deletedProfile }: any) => {
      const myHash = emailHash.toLowerCase();
      if (deletedProfile && removed) markDeletedUserHash(String(removed).toLowerCase());
      const removedGroupId = String(group?._id || groupId || "");
      if (!removedGroupId) return;
      if (removed?.toLowerCase() === myHash) {
        setGroups((prev) => prev.filter((g) => g._id !== removedGroupId));
        setGroupMessages((prev) => prev.filter((m) => m.groupId !== removedGroupId));
        setSelectedChatState((prev) =>
          prev?.type === "group" && prev.groupId === removedGroupId ? null : prev
        );
        storageUtil.clearGroup(myHash, removedGroupId).catch(() => {});
        toast("You were removed from the group");
      } else if (group) {
        setGroups((prev) => prev.map((g) => (g._id === group._id ? group : g)));
      }
    });

    socket.on("dm:read", (payload: any) => {
      const myHash = emailHash.toLowerCase();
      const ownerHash = (payload?.ownerHash || "").toLowerCase();
      const peerHash = (payload?.peerHash || "").toLowerCase();
      const lastReadAt = payload?.lastReadAt
        ? new Date(payload.lastReadAt).getTime()
        : Date.now();
      if (peerHash !== myHash || !ownerHash) return;
      setDmReadState((prev) => ({
        ...prev,
        theirs: {
          ...prev.theirs,
          [ownerHash]: Math.max(prev.theirs[ownerHash] ?? 0, lastReadAt),
        },
      }));
    });

    socket.on("group:read", (payload: any) => {
      const messageId = String(payload?.messageId || "");
      const actor = (payload?.actorEmailHash || "").toLowerCase();
      const readAt = payload?.readAt ? new Date(payload.readAt).getTime() : Date.now();
      if (!messageId || !actor) return;
      setGroupReads((prev) => {
        const existing = prev[messageId] || [];
        if (existing.some((e) => e.emailHash === actor)) return prev;
        return { ...prev, [messageId]: [...existing, { emailHash: actor, readAt }] };
      });
    });

    socket.on("typing:start", (payload: any) => {
      const actor = (payload?.emailHash || "").toLowerCase();
      const chatId = String(payload?.chatId || "");
      if (!actor || !chatId) return;
      const myHash = emailHash.toLowerCase();
      if (actor === myHash) return;
      const isGroup = groupsRef.current.some((g) => String(g._id) === chatId);

      const key: ChatKey = isGroup ? `group:${chatId}` : `dm:${actor}`;
      setTypingPeers((prev) => {
        const list = prev[key] || [];
        if (list.includes(actor)) return prev;
        return { ...prev, [key]: [...list, actor] };
      });
      scheduleTypingExpiry(key, actor);
    });

    socket.on("typing:stop", (payload: any) => {
      const actor = (payload?.emailHash || "").toLowerCase();
      const chatId = String(payload?.chatId || "");
      if (!actor || !chatId) return;
      const isGroup = groupsRef.current.some((g) => String(g._id) === chatId);
      const key: ChatKey = isGroup ? `group:${chatId}` : `dm:${actor}`;
      const tKey = `${key}|${actor}`;
      if (typingExpireTimers.current[tKey]) {
        clearTimeout(typingExpireTimers.current[tKey]);
        delete typingExpireTimers.current[tKey];
      }
      setTypingPeers((prev) => {
        const list = prev[key];
        if (!list) return prev;
        const next = list.filter((h) => h !== actor);
        if (next.length === list.length) return prev;
        return { ...prev, [key]: next };
      });
    });

    
    socket.on("notification:new", (notification: any) => {
      window.dispatchEvent(
        new CustomEvent("friend:notification:new", { detail: notification })
      );
    });

    socket.on("notification:removed", ({ requestId }: any) => {
      window.dispatchEvent(
        new CustomEvent("friend:notification:removed", { detail: { requestId } })
      );
    });

    socket.on("friend:connected", ({ friendHash }: any) => {
      window.dispatchEvent(
        new CustomEvent("friend:connected", { detail: { friendHash } })
      );
    });

    socket.on("friend:blocked", ({ peerHash }: any) => {
      window.dispatchEvent(
        new CustomEvent("friend:blocked", { detail: { peerHash } })
      );
    });

    socket.on("friend:unblocked", ({ peerHash }: any) => {
      window.dispatchEvent(
        new CustomEvent("friend:unblocked", { detail: { peerHash } })
      );
    });

    socket.on("group:request:new", ({ group }: any) => {
      if (!group) return;
      setGroups((prev) => {
        const idx = prev.findIndex((g) => g._id === group._id);
        if (idx === -1) return [group, ...prev];
        const copy = [...prev];
        copy[idx] = group;
        return copy;
      });
    });

    socket.on("group:request:approved", ({ group }: any) => {
      if (group) {
        setGroups((prev) => {
          const idx = prev.findIndex((g) => g._id === group._id);
          if (idx === -1) return [group, ...prev];
          const copy = [...prev];
          copy[idx] = group;
          return copy;
        });
      }
      fetchAndStoreKeyEnvelopes().catch(() => {});
    });

    socket.on("group:request:rejected", (_payload: any) => {

    });

    socket.on("group:updated", ({ group }: any) => {
      if (!group) return;
      setGroups((prev) => prev.map((g) => (g._id === group._id ? group : g)));
      fetchAndStoreKeyEnvelopes().catch(() => {});
    });

    socket.on("group:key:needed", async (payload: any) => {
      if (!payload?.groupId || typeof payload.currentKeyId !== "number") return;
      const myHash = emailHash.toLowerCase();
      const groupId = String(payload.groupId);
      const keyId = payload.currentKeyId;
      try {
        const keyEntry = await storageUtil.getGroupKey(myHash, groupId, keyId);
        if (!keyEntry) return;
        const pending: string[] = Array.isArray(payload.members) ? payload.members : [];
        const targets = pending
          .map((h: string) => h.toLowerCase())
          .filter((h) => h !== myHash);
        if (targets.length === 0) return;
        const envelopes = await buildKeyEnvelopes(groupId, keyId, keyEntry.groupKey, targets);
        if (envelopes.length === 0) return;
        const BACKEND_URL = getBackendUrl();
        await axios.post(
          `${BACKEND_URL}/groups/${groupId}/key-distribution`,
          { envelopes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e: any) {
        console.error("[Chat] group:key:needed handler failed", e.message);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    isConnected,
    token,
    emailHash,
    enqueue,
    fetchAndStoreKeyEnvelopes,
    refreshGroups,
    refreshDMs,
    refreshReadState,
    refreshGroupOpenedState,
    buildKeyEnvelopes,
    purgeDeletedDMPeer,
    scheduleTypingExpiry,
    refreshActiveSocketRooms,
  ]);

  useEffect(() => {
    if (!isConnected || !token || !emailHash) return;
    const onKeysReady = () => {
      refreshActiveSocketRooms();
      fetchAndStoreKeyEnvelopes().catch(() => {});
      refreshGroups().catch(() => {});
      refreshDMs().catch(() => {});
      const selected = selectedChatRef.current;
      const myHash = emailHash.toLowerCase();
      if (selected?.type === "dm") {
        storageUtil
          .getChatHistory(myHash, selected.otherHash, { limit: 50 })
          .then((history) => setMessages(filterLocalHistoryForFreshStart(history)))
          .catch(() => {});
      } else if (selected?.type === "group") {
        storageUtil
          .getGroupHistory(myHash, selected.groupId, { limit: 50 })
          .then((history) => setGroupMessages(dedupeById(filterLocalHistoryForFreshStart(history))))
          .catch(() => {});
      }
    };
    window.addEventListener(E2EE_KEYS_READY_EVENT, onKeysReady);
    return () => window.removeEventListener(E2EE_KEYS_READY_EVENT, onKeysReady);
  }, [
    isConnected,
    token,
    emailHash,
    refreshActiveSocketRooms,
    fetchAndStoreKeyEnvelopes,
    refreshGroups,
    refreshDMs,
    filterLocalHistoryForFreshStart,
  ]);



  
  const prevSelectedChatRef = useRef<SelectedChat>(null);
  
  useEffect(() => {
    
    setHasMoreMessages(true);
    isLoadingOlderRef.current = false;

    if (!emailHash || !selectedChat) {
      setMessages([]);
      setGroupMessages([]);
      setIsLoadingChatMessages(false);
      prevSelectedChatRef.current = selectedChat;
      return;
    }
    
    const myHash = emailHash.toLowerCase();
    const prevChat = prevSelectedChatRef.current;
    const isSwitchingChat = prevChat && 
      (prevChat.type !== selectedChat.type || 
       (prevChat.type === "dm" && selectedChat.type === "dm" && prevChat.otherHash !== selectedChat.otherHash) ||
       (prevChat.type === "group" && selectedChat.type === "group" && prevChat.groupId !== selectedChat.groupId));
    
    
    const isOpeningChat = !prevChat || isSwitchingChat;
    if (isOpeningChat) {
      setIsLoadingChatMessages(true);
    }
    
    if (selectedChat.type === "dm") {
      
      
      if (isSwitchingChat) {
        setMessages([]);
      }
      storageUtil
        .getChatHistory(myHash, selectedChat.otherHash, { limit: 50 })
        .then((msgs) => {
          setMessages(filterLocalHistoryForFreshStart(msgs));
          setIsLoadingChatMessages(false);
        })
        .catch(() => setIsLoadingChatMessages(false));
      const peerHashAtOpen = selectedChat.otherHash.toLowerCase();
      const syncDMChat = async () => {
        const headers = scopedHeaders();
        if (!headers) return;
        const BACKEND_URL = getBackendUrl();
        
        
        
        
        
        
        
        dmSyncInProgressRef.current = true;
        dmSyncBufferRef.current = [];
        try {
          const res = await axios.get(`${BACKEND_URL}/chat/sync`, {
            params: { peerHash: peerHashAtOpen, limit: 50 },
            headers,
          });
          for (const env of res.data.messages || []) enqueue("dm", env);
        } finally {
          
          
          while (isProcessing.current || processingQueue.current.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
          try {
            const history = filterLocalHistoryForFreshStart(
              await storageUtil.getChatHistory(myHash, peerHashAtOpen)
            );
            const latest = history[history.length - 1];
            if (latest) {
              setDMs((prev) => {
                const idx = prev.findIndex((d) => d.otherHash === peerHashAtOpen);
                const existingLatest = idx >= 0 ? prev[idx].lastMessage : null;
                
                
                if (existingLatest && existingLatest.timestamp === latest.timestamp && existingLatest._id === latest._id) {
                  return prev;
                }
                let next: DMSummary[];
                if (idx === -1) {
                  next = [
                    {
                      otherHash: peerHashAtOpen,
                      contentTopic: `chat-${[myHash, peerHashAtOpen].sort().join("-")}`,
                      lastMessage: latest,
                    },
                    ...prev,
                  ];
                } else {
                  next = prev.slice();
                  next[idx] = { ...next[idx], lastMessage: latest };
                }
                next.sort(
                  (a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0),
                );
                return next;
              });
              emitDMActivity(peerHashAtOpen, latest.timestamp);
            }
          } catch {}
          dmSyncInProgressRef.current = false;
          
          const buffered = dmSyncBufferRef.current.splice(0);
          for (const env of buffered) enqueue("dm", env);
        }
      };
      syncDMChat().catch((e: any) => {
        console.error("[Chat] sync dm messages failed", e.message);
        dmSyncInProgressRef.current = false;
      });
      setGroupMessages([]);
    } else {
      const group = groupsRef.current.find((g) => g._id === selectedChat.groupId);
      const isMember = !!group?.members?.some((m) => m.emailHash.toLowerCase() === myHash);
      if (!isMember) {
        setGroupMessages([]);
        setMessages([]);
        setIsLoadingChatMessages(false);
        prevSelectedChatRef.current = selectedChat;
        return;
      }
      
      
      if (isSwitchingChat) {
        setGroupMessages([]);
        setMessages([]);
      }
      storageUtil
        .getGroupHistory(myHash, selectedChat.groupId, { limit: 50 })
        .then((history) => {
          setGroupMessages(dedupeById(filterLocalHistoryForFreshStart(history)));
          setIsLoadingChatMessages(false);
        })
        .catch(() => setIsLoadingChatMessages(false));
      const syncGroupChat = async () => {
        await fetchAndStoreKeyEnvelopes();
        const headers = scopedHeaders();
        if (!headers) return;
        const BACKEND_URL = getBackendUrl();
        const boundary = getFreshStartBoundary();
        const res = await axios.get(`${BACKEND_URL}/groups/${selectedChat.groupId}/messages`, {
          params: {
            limit: 50,
            ...(boundary ? { since: new Date(boundary).toISOString() } : {}),
          },
          headers,
        });
        for (const env of res.data.messages || []) enqueue("group", env);
      };
      syncGroupChat().catch((e: any) =>
        console.error("[Chat] sync group messages failed", e.message)
      );
    }
    
    
    prevSelectedChatRef.current = selectedChat;
  }, [emailHash, selectedChat, scopedHeaders, enqueue, fetchAndStoreKeyEnvelopes, filterLocalHistoryForFreshStart, getFreshStartBoundary]);

  
  const PAGE_SIZE = 50;
  const loadOlderMessages = useCallback(async () => {
    if (!emailHash || !selectedChat || isLoadingOlderRef.current) return;
    isLoadingOlderRef.current = true;
    setIsLoadingOlderMessages(true);
    const myHash = emailHash.toLowerCase();
    const BACKEND_URL = getBackendUrl();

    try {
      if (selectedChat.type === "dm") {
        const oldestTs = messagesRef.current[0]?.timestamp;
        if (!oldestTs) { setHasMoreMessages(false); return; }
        const boundary = getFreshStartBoundary();
        if (boundary && oldestTs <= boundary) { setHasMoreMessages(false); return; }

        
        const idbOlderRaw = await storageUtil.getChatHistory(myHash, selectedChat.otherHash, {
          before: oldestTs,
          limit: PAGE_SIZE,
        });
        const idbOlder = filterLocalHistoryForFreshStart(idbOlderRaw);
        if (idbOlder.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m._id));
            return [...idbOlder.filter((m) => !seen.has(m._id)), ...prev];
          });
          if (idbOlder.length >= PAGE_SIZE) return;
        }

        
        const headers = scopedHeaders();
        if (!headers) return;
        const beforeCursor = idbOlder[0]?.timestamp || oldestTs;
        const res = await axios.get(`${BACKEND_URL}/chat/sync`, {
          params: {
            peerHash: selectedChat.otherHash,
            before: beforeCursor,
            limit: PAGE_SIZE,
            ...(boundary ? { since: new Date(boundary).toISOString() } : {}),
          },
          headers,
        });
        const incoming = res.data.messages || [];
        if (incoming.length === 0) { setHasMoreMessages(false); return; }
        for (const env of incoming) enqueue("dm", env);
        
        await new Promise<void>((r) => setTimeout(r, 800));
        const decrypted = filterLocalHistoryForFreshStart(
          await storageUtil.getChatHistory(myHash, selectedChat.otherHash, {
            before: oldestTs,
            limit: PAGE_SIZE,
          })
        );
        if (decrypted.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m._id));
            return [...decrypted.filter((m) => !seen.has(m._id)), ...prev];
          });
        }
        if (incoming.length < PAGE_SIZE) setHasMoreMessages(false);

      } else if (selectedChat.type === "group") {
        const oldestTs = groupMessagesRef.current[0]?.timestamp;
        if (!oldestTs) { setHasMoreMessages(false); return; }
        const boundary = getFreshStartBoundary();
        if (boundary && oldestTs <= boundary) { setHasMoreMessages(false); return; }

        
        const idbOlderRaw = await storageUtil.getGroupHistory(myHash, selectedChat.groupId, {
          before: oldestTs,
          limit: PAGE_SIZE,
        });
        const idbOlder = filterLocalHistoryForFreshStart(idbOlderRaw);
        if (idbOlder.length > 0) {
          setGroupMessages((prev) => {
            const seen = new Set(prev.map((m) => m._id));
            return [...idbOlder.filter((m) => !seen.has(m._id)), ...prev];
          });
          if (idbOlder.length >= PAGE_SIZE) return;
        }

        
        const headers = scopedHeaders();
        if (!headers) return;
        const beforeCursor = idbOlder[0]?.timestamp || oldestTs;
        const res = await axios.get(`${BACKEND_URL}/groups/${selectedChat.groupId}/messages`, {
          params: {
            before: beforeCursor,
            limit: PAGE_SIZE,
            ...(boundary ? { since: new Date(boundary).toISOString() } : {}),
          },
          headers,
        });
        const incoming = res.data.messages || [];
        if (incoming.length === 0) { setHasMoreMessages(false); return; }
        for (const env of incoming) enqueue("group", env);
        await new Promise<void>((r) => setTimeout(r, 800));
        const decrypted = filterLocalHistoryForFreshStart(
          await storageUtil.getGroupHistory(myHash, selectedChat.groupId, {
            before: oldestTs,
            limit: PAGE_SIZE,
          })
        );
        if (decrypted.length > 0) {
          setGroupMessages((prev) => {
            const seen = new Set(prev.map((m) => m._id));
            return [...decrypted.filter((m) => !seen.has(m._id)), ...prev];
          });
        }
        if (incoming.length < PAGE_SIZE) setHasMoreMessages(false);
      }
    } catch (e: any) {
      console.error("[Chat] loadOlderMessages failed", e.message);
    } finally {
      isLoadingOlderRef.current = false;
      setIsLoadingOlderMessages(false);
    }
  }, [emailHash, selectedChat, scopedHeaders, enqueue, getFreshStartBoundary, filterLocalHistoryForFreshStart]);
  

  const socket = socketRef.current;

  const value = useMemo<ChatContextType>(
    () => ({
      socket,
      currentIdentityHash: emailHash ? emailHash.toLowerCase() : null,
      dms,
      groups,
      groupsHasMore,
      groupsLoading,
      dmsLoading,
      messages,
      groupMessages,
      selectedChat,
      setSelectedChat,
      loading,
      isLoadingChatMessages,
      error,
      dmReadState,
      groupReads,
      typingPeers,
      sendDirectMessage,
      sendGroupMessage,
      sendAttachment,
      createGroup,
      addGroupMember,
      removeGroupMember,
      promoteGroupAdmin,
      demoteGroupAdmin,
      leaveGroup,
      updateGroup,
      manageGroupRequest,
      previewProfile,
      previewGroup,
      joinGroupByShareToken,
      markDirectRead,
      markGroupRead,
      refreshReadState,
      groupOpenedAt,
      markGroupOpened,
      refreshGroupOpenedState,
      startTyping,
      stopTyping,
      refreshGroups,
      loadMoreGroups,
      refreshDMs,
      loadOlderMessages,
      hasMoreMessages,
      isLoadingOlderMessages,
    }),
    [
      socket,
      emailHash,
      dms,
      groups,
      groupsHasMore,
      groupsLoading,
      dmsLoading,
      messages,
      groupMessages,
      selectedChat,
      loading,
      isLoadingChatMessages,
      error,
      dmReadState,
      groupReads,
      typingPeers,
      sendDirectMessage,
      sendGroupMessage,
      sendAttachment,
      createGroup,
      addGroupMember,
      removeGroupMember,
      promoteGroupAdmin,
      demoteGroupAdmin,
      leaveGroup,
      updateGroup,
      manageGroupRequest,
      previewProfile,
      previewGroup,
      joinGroupByShareToken,
      markDirectRead,
      markGroupRead,
      refreshReadState,
      groupOpenedAt,
      markGroupOpened,
      refreshGroupOpenedState,
      startTyping,
      stopTyping,
      refreshGroups,
      loadMoreGroups,
      refreshDMs,
      loadOlderMessages,
      hasMoreMessages,
      isLoadingOlderMessages,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
