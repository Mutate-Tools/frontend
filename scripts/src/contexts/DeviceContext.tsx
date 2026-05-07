"use client";

import axios, { InternalAxiosRequestConfig } from "axios";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { encodeBase64 } from "tweetnacl-util";
import { useAuth } from "./AuthContext";
import { useSubProfile } from "./SubProfileContext";
import {
  DeviceKeypair,
  generateDeviceKeypair,
} from "@/src/utils/crypto/device-crypto-util";
import {
  decryptVault,
  encryptVault,
  importVaultPlaintext,
  EncryptedVaultPayload,
} from "@/src/utils/crypto/vault-util";
import {
  generateIdentityKeypair,
  getIdentityKeypair,
  listStoredIdentityHashes,
  storeIdentityKeypair,
} from "@/src/utils/crypto/identity-util";
import { generateUserPrekeyBundle } from "@/src/utils/crypto/x3dh-util";
import { getBackendUrl } from '@/src/utils/backend-url';

export interface TrustedDevice {
  deviceId: string;
  publicKey: string;
  name?: string;
  status: "active" | "revoked";
  revokedAt?: string | null;
  lastSeenAt?: string | null;
}

export const E2EE_KEYS_READY_EVENT = "mutate:e2ee-keys-ready";

interface DeviceContextValue {
  ready: boolean;
  deviceId: string | null;
  deviceKeypair: DeviceKeypair | null;
  devices: TrustedDevice[];
  vaultExists: boolean;
  vaultUnlocked: boolean;
  deviceSetupMode: "needs_e2ee_choice" | "linked" | "fresh_start" | "restored_from_passphrase" | null;
  freshStartAt: number | null;
  needsE2EEChoice: boolean;
  hasAnyUsableSubProfile: boolean;
  listDevices: () => Promise<TrustedDevice[]>;
  listDevicesForIdentity: (identityHash: string) => Promise<TrustedDevice[]>;
  backupVault: (passphrase?: string) => Promise<void>;
  restoreVault: (passphrase: string) => Promise<void>;
  startDeviceLink: () => Promise<{ syncCode: string; expiresIn: number }>;
  startApprovalOffer: () => Promise<{ syncCode: string; expiresIn: number }>;
  claimApprovalOffer: (syncCode: string) => Promise<{ syncCode: string; status: string; expiresIn: number }>;
  pollDeviceLink: (syncCode: string) => Promise<any>;
  approveDeviceLink: (syncCode: string) => Promise<void>;
  revokeDevice: (deviceId: string) => Promise<void>;
  hasIdentityKey: (identityHash?: string | null) => boolean;
  markFreshStart: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);


const DEVICE_ID_KEY = "mutate_device_id_v1";
const DEVICE_KEYPAIR_KEY = "mutate_device_keypair_v1";
const IDB_STORE_NAME = "mutate_device_store";
const IDB_DB_NAME = "mutate_persistent_v1";
const deviceSetupModeKey = (parentEmailHash: string) =>
  `parent_device_mode_${parentEmailHash.toLowerCase()}`;
const legacyDeviceSetupModeKey = (parentEmailHash: string) =>
  `device_setup_mode_${parentEmailHash.toLowerCase()}`;
const freshStartAtKey = (parentEmailHash: string) =>
  `parent_fresh_started_at_${parentEmailHash.toLowerCase()}`;

const deviceRef: { current: string | null } = { current: null };
let interceptorInstalled = false;

function installDeviceInterceptor() {
  if (interceptorInstalled) return;
  interceptorInstalled = true;
  axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const id = deviceRef.current;
    if (!id) return config;
    const hdrs = config.headers as Record<string, any>;
    if (hdrs && (hdrs["X-Device-Id"] || hdrs["x-device-id"])) return config;
    config.headers.set("X-Device-Id", id);
    return config;
  });
}

async function getPersistedDeviceId(): Promise<string | null> {
  try {
    if (typeof window === "undefined" || !("indexedDB" in window)) return null;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(IDB_DB_NAME, 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
    });
    const tx = db.transaction(IDB_STORE_NAME, "readonly");
    const result = await new Promise<string | null>((resolve, reject) => {
      const req = tx.objectStore(IDB_STORE_NAME).get("deviceId");
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result || null);
    });
    db.close();
    return result;
  } catch (e) {
    console.warn("[Device] IndexedDB read failed, falling back to localStorage");
    return null;
  }
}

async function persistDeviceId(deviceId: string): Promise<void> {
  try {
    if (typeof window === "undefined" || !("indexedDB" in window)) return;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(IDB_DB_NAME, 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
    });
    const tx = db.transaction(IDB_STORE_NAME, "readwrite");
    await new Promise<void>((resolve, reject) => {
      const req = tx.objectStore(IDB_STORE_NAME).put(deviceId, "deviceId");
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
    db.close();
  } catch (e) {
    console.warn("[Device] IndexedDB write failed");
  }
}

function getOrCreateDevice(): { deviceId: string; keypair: DeviceKeypair } {
  const storedId = localStorage.getItem(DEVICE_ID_KEY);
  const storedKeypair = localStorage.getItem(DEVICE_KEYPAIR_KEY);
  if (storedId && storedKeypair) {
    return { deviceId: storedId, keypair: JSON.parse(storedKeypair) };
  }
  const deviceId =
    crypto.randomUUID?.() ||
    `device_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const keypair = generateDeviceKeypair();
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  localStorage.setItem(DEVICE_KEYPAIR_KEY, JSON.stringify(keypair));
  
  persistDeviceId(deviceId).catch(() => {});
  return { deviceId, keypair };
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const { token, isConnected, emailHash: parentEmailHash } = useAuth();
  const { activeIdentityHash, subProfiles, loading: subProfilesLoading } = useSubProfile();
  const [ready, setReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceKeypair, setDeviceKeypair] = useState<DeviceKeypair | null>(null);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [vaultExists, setVaultExists] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [deviceSetupMode, setDeviceSetupMode] = useState<
    "needs_e2ee_choice" | "linked" | "fresh_start" | "restored_from_passphrase" | null
  >(null);
  const [freshStartAt, setFreshStartAt] = useState<number | null>(null);
  const [keyRefreshNonce, setKeyRefreshNonce] = useState(0);
  const passphraseRef = useRef<string | null>(null);
  const freshInitRef = useRef<string | null>(null);

  const notifyKeysReady = useCallback(() => {
    setKeyRefreshNonce((prev) => prev + 1);
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(E2EE_KEYS_READY_EVENT));
  }, []);

  useEffect(() => {
    installDeviceInterceptor();
    if (typeof window === "undefined") return;
    const local = getOrCreateDevice();
    setDeviceId(local.deviceId);
    setDeviceKeypair(local.keypair);
    deviceRef.current = local.deviceId;
    setReady(true);
  }, []);

  
  
  
  
  
  
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKeysReady = () => setKeyRefreshNonce((prev) => prev + 1);
    window.addEventListener(E2EE_KEYS_READY_EVENT, onKeysReady);
    return () => window.removeEventListener(E2EE_KEYS_READY_EVENT, onKeysReady);
  }, []);

  const listDevices = useCallback(async () => {
    if (!token) return [];
    const res = await axios.get(`${getBackendUrl()}/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const next = (res.data.devices || []).filter(
      (device: TrustedDevice) => device.status === "active"
    );
    setDevices(next);
    return next;
  }, [token]);

  const listDevicesForIdentity = useCallback(
    async (identityHash: string) => {
      if (!token || !identityHash) return [];
      const res = await axios.get(
        `${getBackendUrl()}/devices/identity/${encodeURIComponent(identityHash.toLowerCase())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return (res.data.devices || []) as TrustedDevice[];
    },
    [token]
  );

  const uploadIdentityMaterial = useCallback(async (identityHash: string, keypair: ReturnType<typeof getIdentityKeypair>) => {
    if (!token || !keypair) return;
    const hash = identityHash.toLowerCase();
    const publicIdentityKey = encodeBase64(keypair.encryption.publicKey);
    const headers = {
      Authorization: `Bearer ${token}`,
      "X-Identity-Hash": hash,
    };
    await axios.post(
      `${getBackendUrl()}/auth/oidc/identity-key`,
      { publicIdentityKey },
      { headers }
    );
    const bundle = generateUserPrekeyBundle(keypair);
    await axios.post(`${getBackendUrl()}/auth/oidc/prekey-bundle`, bundle, { headers });
    localStorage.setItem(`bundle_uploaded_${hash}_${publicIdentityKey}`, "true");
  }, [token]);

  const uploadPrekeysForStoredIdentities = useCallback(async () => {
    if (!token) return;
    const allowed = new Set(subProfiles.map((sp) => sp.identityHash.toLowerCase()));
    for (const hash of listStoredIdentityHashes()) {
      if (!allowed.has(hash.toLowerCase())) continue;
      const kp = getIdentityKeypair(hash);
      if (!kp) continue;
      await uploadIdentityMaterial(hash, kp);
    }
  }, [token, subProfiles, uploadIdentityMaterial]);

  /**
   * Same as uploadPrekeysForStoredIdentities but fetches sub-profiles directly
   * from the API instead of reading React state. Use this after vault restore /
   * device-link because subProfiles state is still [] at that point (it hasn't
   * been populated by SubProfileContext yet), which would silently skip every
   * sub-profile and leave Device B without prekey bundles.
   */
  const uploadPrekeysAfterRestore = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${getBackendUrl()}/subprofiles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profiles: Array<{ identityHash: string }> = res.data?.subProfiles || [];
      const allowed = new Set(profiles.map((sp) => sp.identityHash.toLowerCase()));
      const hashes = listStoredIdentityHashes();
      for (const hash of hashes) {
        if (!allowed.has(hash.toLowerCase())) continue;
        const kp = getIdentityKeypair(hash);
        if (!kp) continue;
        await uploadIdentityMaterial(hash, kp);
      }
    } catch (e: any) {
      console.warn("[Device] uploadPrekeysAfterRestore failed:", e?.message || e);
    }
  }, [token, uploadIdentityMaterial]);

  const initializeFreshSubProfileKeys = useCallback(async () => {
    if (!token || subProfiles.length === 0) return;
    const runKey = subProfiles
      .map((sp) => sp.identityHash.toLowerCase())
      .sort()
      .join("|");
    if (freshInitRef.current === runKey) return;
    for (const profile of subProfiles) {
      const hash = profile.identityHash.toLowerCase();
      let keypair = getIdentityKeypair(hash);
      if (!keypair) {
        keypair = generateIdentityKeypair();
        storeIdentityKeypair(hash, keypair);
      }
      await uploadIdentityMaterial(hash, keypair);
    }
    freshInitRef.current = runKey;
    notifyKeysReady();
  }, [token, subProfiles, uploadIdentityMaterial, notifyKeysReady]);

  const backupVault = useCallback(
    async (passphrase?: string) => {
      if (!token) throw new Error("Not authenticated");
      if (!parentEmailHash) throw new Error("Parent profile not loaded");
      const phrase = passphrase || passphraseRef.current;
      if (!phrase) throw new Error("Recovery passphrase required");

      console.log(
        "[Device] Starting vault backup for parent:",
        parentEmailHash.toLowerCase().slice(0, 16) + "..."
      );

      try {
        const payload = await encryptVault(phrase);
        await axios.put(`${getBackendUrl()}/e2ee/vault`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        passphraseRef.current = phrase;
        setVaultUnlocked(true);
        setVaultExists(true);
        setDeviceSetupMode("linked");
        notifyKeysReady();
        console.log("[Device] Vault backup completed successfully");
      } catch (err: any) {
        console.error(
          "[Device] Vault backup failed:",
          err?.response?.data?.error || err?.message || err
        );
        throw err;
      }
    },
    [token, parentEmailHash, notifyKeysReady]
  );

  const restoreVault = useCallback(
    async (passphrase: string) => {
      if (!token) throw new Error("Not authenticated");
      if (!parentEmailHash) throw new Error("Parent profile not loaded");
      if (!passphrase) throw new Error("Passphrase required");

      console.log(
        "[Device] Starting vault restore for parent:",
        parentEmailHash.toLowerCase().slice(0, 16) + "..."
      );

      try {
        const res = await axios.get(`${getBackendUrl()}/e2ee/vault`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const vault = res.data.vault as EncryptedVaultPayload | null;
        if (!vault) throw new Error("No recovery vault exists for this account");

        console.log(
          "[Device] Attempting to decrypt vault from",
          vault.version ? `v${vault.version}` : "unknown version"
        );

        let plaintext;
        try {
          plaintext = await decryptVault(vault, passphrase);
        } catch (decryptErr: any) {
          console.error(
            "[Device] Vault decryption failed - wrong passphrase or corrupted data:",
            decryptErr?.message
          );
          throw new Error("Incorrect passphrase or corrupted vault");
        }

        console.log("[Device] Importing vault plaintext (localStorage + indexedDb)");
        await importVaultPlaintext(plaintext);

        passphraseRef.current = passphrase;
        setVaultUnlocked(true);

        // Use the API-fetching variant so we don't race against SubProfileContext
        // loading — subProfiles state is still [] at this point.
        console.log("[Device] Uploading prekeys for all sub-profiles");
        await uploadPrekeysAfterRestore();

        setDeviceSetupMode("restored_from_passphrase");
        setFreshStartAt(null);
        notifyKeysReady();

        console.log("[Device] Vault restore completed successfully");
        toast.success("E2EE vault restored - all chats and keys recovered");
      } catch (err: any) {
        const errMsg =
          err?.message ||
          err?.response?.data?.error ||
          "Failed to restore vault";
        console.error("[Device] Vault restore error:", errMsg);
        throw new Error(errMsg);
      }
    },
    [token, parentEmailHash, uploadPrekeysAfterRestore, notifyKeysReady]
  );

  const startDeviceLink = useCallback(async () => {
    if (!token || !deviceId || !deviceKeypair) throw new Error("Device not ready");
    const res = await axios.post(
      `${getBackendUrl()}/auth/oidc/sync/start`,
      { deviceId, publicKey: deviceKeypair.publicKey },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  }, [token, deviceId, deviceKeypair]);

  const startApprovalOffer = useCallback(async () => {
    if (!token || !deviceId) throw new Error("Device not ready");
    const res = await axios.post(
      `${getBackendUrl()}/auth/oidc/sync/offer`,
      { approverDeviceId: deviceId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  }, [token, deviceId]);

  const claimApprovalOffer = useCallback(
    async (syncCode: string) => {
      if (!token || !deviceId || !deviceKeypair) throw new Error("Device not ready");
      const res = await axios.post(
        `${getBackendUrl()}/auth/oidc/sync/claim`,
        { syncCode, deviceId, publicKey: deviceKeypair.publicKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    [token, deviceId, deviceKeypair]
  );

  const pollDeviceLink = useCallback(
    async (syncCode: string) => {
      if (!token) throw new Error("Not authenticated");
      const res = await axios.get(
        `${getBackendUrl()}/auth/oidc/sync/poll/${encodeURIComponent(syncCode)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "completed" && res.data.encryptedPayload && deviceKeypair) {
        const { decryptFromDevice } = await import("@/src/utils/crypto/device-crypto-util");
        const plaintext = decryptFromDevice(JSON.parse(res.data.encryptedPayload), deviceKeypair);
        await importVaultPlaintext(JSON.parse(plaintext));
        // Use the API-fetching variant to avoid the subProfiles state race condition.
        await uploadPrekeysAfterRestore();
        setVaultUnlocked(true);
        setDeviceSetupMode("linked");
        setFreshStartAt(null);
        notifyKeysReady();
        toast.success("Device linked");
      }
      return res.data;
    },
    [token, deviceKeypair, uploadPrekeysAfterRestore, notifyKeysReady]
  );

  const approveDeviceLink = useCallback(
    async (syncCode: string) => {
      if (!token || !deviceId || !deviceKeypair) throw new Error("Device not ready");
      const poll = await axios.get(
        `${getBackendUrl()}/auth/oidc/sync/poll/${encodeURIComponent(syncCode)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const requesterPublicKey = poll.data.requesterPublicKey;
      if (!requesterPublicKey) throw new Error("Sync request is missing requester key");
      const { exportVaultPlaintext } = await import("@/src/utils/crypto/vault-util");
      const { encryptForDevice } = await import("@/src/utils/crypto/device-crypto-util");
      const encryptedPayload = JSON.stringify(
        encryptForDevice(JSON.stringify(await exportVaultPlaintext()), requesterPublicKey, deviceKeypair)
      );
      await axios.post(
        `${getBackendUrl()}/auth/oidc/sync/approve`,
        { syncCode, encryptedPayload, approverDeviceId: deviceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Device approved");
    },
    [token, deviceId, deviceKeypair]
  );

  const revokeDevice = useCallback(
    async (targetDeviceId: string) => {
      if (!token) return;
      await axios.post(
        `${getBackendUrl()}/devices/${encodeURIComponent(targetDeviceId)}/revoke`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDevices((prev) => prev.filter((device) => device.deviceId !== targetDeviceId));
      await listDevices();
    },
    [token, listDevices]
  );

  useEffect(() => {
    if (!isConnected || !token || !deviceId || !deviceKeypair) return;
    // Wait for SubProfileContext to finish loading so the axios interceptor
    // can attach the correct X-Identity-Hash header. Without this guard,
    // Device B (QR-scanned / phrase-restored) would register under the parent
    // email hash before the sub-profile is known, causing listDevicesForIdentity
    // to miss Device B when building device envelopes — breaking real-time
    // message delivery on the second device.
    if (subProfilesLoading) return;
    axios
      .post(
        `${getBackendUrl()}/devices/register`,
        {
          deviceId,
          publicKey: deviceKeypair.publicKey,
          name: navigator.userAgent.slice(0, 80),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => listDevices())
      .catch((e) => console.warn("[Device] register failed", e.message));
    axios
      .get(`${getBackendUrl()}/e2ee/vault`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setVaultExists(!!res.data.vault))
      .catch(() => setVaultExists(false));
  // activeIdentityHash in deps ensures we re-register (idempotent) whenever
  // the active sub-profile changes, keeping the server's device→identity
  // mapping in sync with the current identity scope.
  }, [isConnected, token, deviceId, deviceKeypair, listDevices, subProfilesLoading, activeIdentityHash]);

  const hasIdentityKey = useCallback((identityHash?: string | null) => {
    if (!identityHash) return false;
    return !!getIdentityKeypair(identityHash.toLowerCase());
  }, []);

  const hasUsableSubProfileKey = useCallback((identityHash?: string | null, publicIdentityKey?: string | null) => {
    if (!identityHash) return false;
    const normalized = identityHash.toLowerCase();
    if (getIdentityKeypair(normalized)) return true;
    if (!publicIdentityKey) return false;
    for (const storedHash of listStoredIdentityHashes()) {
      const candidate = getIdentityKeypair(storedHash);
      if (!candidate) continue;
      if (encodeBase64(candidate.encryption.publicKey) === publicIdentityKey) return true;
    }
    return false;
  }, []);

  const hasAnyUsableSubProfile = useMemo(
    () => subProfiles.some((sp) => hasUsableSubProfileKey(sp.identityHash, sp.publicIdentityKey)),
    [subProfiles, hasUsableSubProfileKey, keyRefreshNonce]
  );

  const markFreshStart = useCallback(async () => {
    setVaultUnlocked(false);
    const now = Date.now();
    setFreshStartAt((prev) => prev || now);
    setDeviceSetupMode("fresh_start");
    await initializeFreshSubProfileKeys();
  }, [initializeFreshSubProfileKeys]);

  useEffect(() => {
    if (!ready || !isConnected) return;
    if (hasAnyUsableSubProfile) {
      setDeviceSetupMode((prev) => {
        if (prev === "fresh_start" || prev === "restored_from_passphrase" || prev === "linked") return prev;
        return "linked";
      });
    }
  }, [ready, isConnected, hasAnyUsableSubProfile]);

  useEffect(() => {
    if (!ready || !isConnected || deviceSetupMode !== "fresh_start" || subProfilesLoading) return;
    initializeFreshSubProfileKeys().catch((e) =>
      console.warn("[Device] fresh key initialization failed", e?.message || e)
    );
  }, [ready, isConnected, deviceSetupMode, subProfilesLoading, initializeFreshSubProfileKeys]);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    if (!isConnected || !parentEmailHash) {
      setDeviceSetupMode(null);
      return;
    }
    const parent = parentEmailHash.toLowerCase();
    const raw =
      localStorage.getItem(deviceSetupModeKey(parent)) ||
      localStorage.getItem(legacyDeviceSetupModeKey(parent));
    if (
      raw === "linked" ||
      raw === "fresh_start" ||
      raw === "restored_from_passphrase"
    ) {
      setDeviceSetupMode(raw);
    } else {
      setDeviceSetupMode(null);
    }
    const startedAt = Number(localStorage.getItem(freshStartAtKey(parent)) || 0);
    setFreshStartAt(Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null);
  }, [ready, isConnected, parentEmailHash]);

  useEffect(() => {
    if (typeof window === "undefined" || !parentEmailHash) return;
    const parent = parentEmailHash.toLowerCase();
    if (deviceSetupMode) {
      localStorage.setItem(deviceSetupModeKey(parent), deviceSetupMode);
    } else {
      localStorage.removeItem(deviceSetupModeKey(parent));
    }
    if (freshStartAt) localStorage.setItem(freshStartAtKey(parent), String(freshStartAt));
    else localStorage.removeItem(freshStartAtKey(parent));
  }, [deviceSetupMode, freshStartAt, parentEmailHash]);

  const needsE2EEChoice = useMemo(() => {
    if (!ready || !isConnected || subProfilesLoading) return false;
    if (subProfiles.length === 0) return false;
    if (hasAnyUsableSubProfile) return false;
    return deviceSetupMode !== "fresh_start";
  }, [ready, isConnected, subProfilesLoading, subProfiles.length, hasAnyUsableSubProfile, deviceSetupMode]);

  const value = useMemo<DeviceContextValue>(
    () => ({
      ready,
      deviceId,
      deviceKeypair,
      devices,
      vaultExists,
      vaultUnlocked,
      deviceSetupMode,
      freshStartAt,
      needsE2EEChoice,
      hasAnyUsableSubProfile,
      listDevices,
      listDevicesForIdentity,
      backupVault,
      restoreVault,
      startDeviceLink,
      startApprovalOffer,
      claimApprovalOffer,
      pollDeviceLink,
      approveDeviceLink,
      revokeDevice,
      hasIdentityKey,
      markFreshStart,
    }),
    [
      ready,
      deviceId,
      deviceKeypair,
      devices,
      vaultExists,
      vaultUnlocked,
      deviceSetupMode,
      freshStartAt,
      needsE2EEChoice,
      hasAnyUsableSubProfile,
      listDevices,
      listDevicesForIdentity,
      backupVault,
      restoreVault,
      startDeviceLink,
      startApprovalOffer,
      claimApprovalOffer,
      pollDeviceLink,
      approveDeviceLink,
      revokeDevice,
      hasIdentityKey,
      markFreshStart,
    ]
  );

  useEffect(() => {
    if (deviceSetupMode === "fresh_start") return;
    if (activeIdentityHash && !hasIdentityKey(activeIdentityHash)) setVaultUnlocked(false);
  }, [activeIdentityHash, subProfiles, hasIdentityKey, deviceSetupMode]);

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevice must be used within DeviceProvider");
  return ctx;
}
