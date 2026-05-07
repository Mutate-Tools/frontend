"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import axios, { InternalAxiosRequestConfig } from "axios";
import { encodeBase64 } from "tweetnacl-util";
import { useAuth } from "./AuthContext";
import {
  generateIdentityKeypair,
  getIdentityKeypair,
  removeIdentityKeypair,
  storeIdentityKeypair,
  IdentityKeypair,
} from "@/src/utils/crypto/identity-util";
import { generateUserPrekeyBundle } from "@/src/utils/crypto/x3dh-util";
import { getBackendUrl } from '@/src/utils/backend-url';
import { notifyPointsMayHaveChanged } from "@/src/utils/point-meta";







export interface SubProfile {
  _id: string;
  identityHash: string;
  name: string;
  avatarId: number;


  avatarUrl?: string | null;
  publicIdentityKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface SubProfileContextType {
  subProfiles: SubProfile[];
  activeSubProfile: SubProfile | null;



  activeIdentityHash: string | null;
  isParentActive: boolean;
  loading: boolean;
  error: string | null;
  switchSubProfile: (identityHash: string | null) => void;
  createSubProfile: (
    name: string,
    avatarId: number,
    avatarUrl?: string | null
  ) => Promise<SubProfile>;
  updateSubProfile: (
    identityHash: string,
    patch: { name?: string; avatarId?: number; avatarUrl?: string | null }
  ) => Promise<SubProfile>;
  deleteSubProfile: (identityHash: string) => Promise<void>;
  refreshSubProfiles: () => Promise<void>;




  uploadSubProfileAvatar: (
    file: File,
    identityHash?: string | null
  ) => Promise<{ avatarUrl: string }>;
}

const SubProfileContext = createContext<SubProfileContextType | undefined>(undefined);

















const activeIdentityRef: { current: string | null; parent: string | null } = {
  current: null,
  parent: null,
};
const ownedIdentityRef: { parent: string | null; hashes: Set<string> } = {
  parent: null,
  hashes: new Set(),
};
let interceptorInstalled = false;
let interceptorId: number | null = null;

function installAxiosInterceptor() {
  if (interceptorInstalled) return;
  interceptorInstalled = true;
  interceptorId = axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    try {
      const active = activeIdentityRef.current;
      const parent = activeIdentityRef.parent;
      if (!active || !parent) return config;
      if (active === parent) return config;
      if (ownedIdentityRef.parent !== parent || !ownedIdentityRef.hashes.has(active)) return config;



      const hdrs = config.headers as Record<string, any>;
      if (hdrs && (hdrs["X-Identity-Hash"] || hdrs["x-identity-hash"])) return config;
      (config.headers as any)["X-Identity-Hash"] = active;
    } catch {

    }
    return config;
  });
}

function activeSubProfileStorageKey(parentEmailHash: string) {
  return `active_subprofile_${parentEmailHash.toLowerCase()}`;
}

export function SubProfileProvider({ children }: { children: ReactNode }) {
  const { emailHash: parentEmailHash, token, isConnected } = useAuth();
  const [subProfiles, setSubProfiles] = useState<SubProfile[]>([]);
  const [activeIdentityHash, setActiveIdentityHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const interceptorReadyRef = useRef(false);


  useEffect(() => {
    if (!interceptorReadyRef.current) {
      installAxiosInterceptor();
      interceptorReadyRef.current = true;
    }
  }, []);



  useEffect(() => {
    activeIdentityRef.current = activeIdentityHash;
    activeIdentityRef.parent = parentEmailHash?.toLowerCase() || null;
  }, [activeIdentityHash, parentEmailHash]);

  const refreshSubProfiles = useCallback(async () => {
    if (!token || !parentEmailHash) return;
    const BACKEND_URL = getBackendUrl();
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/subprofiles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list: SubProfile[] = (res.data?.subProfiles || []).map((s: any) => ({
        _id: String(s._id),
        identityHash: s.identityHash,
        name: s.name,
        avatarId: s.avatarId ?? 0,
        avatarUrl: s.avatarUrl ?? null,
        publicIdentityKey: s.publicIdentityKey || null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
      setSubProfiles(list);
      ownedIdentityRef.parent = parentEmailHash.toLowerCase();
      ownedIdentityRef.hashes = new Set(list.map((s) => s.identityHash.toLowerCase()));



      const storageKey = activeSubProfileStorageKey(parentEmailHash);
      const saved = localStorage.getItem(storageKey);
      if (saved && list.some((s) => s.identityHash === saved)) {
        setActiveIdentityHash(saved.toLowerCase());
      } else if (list.length > 0) {



        const first = list[0].identityHash.toLowerCase();
        setActiveIdentityHash(first);
        localStorage.setItem(storageKey, first);
      } else {
        setActiveIdentityHash(null);
      }
    } catch (e: any) {
      console.error("[SubProfile] refresh failed", e?.message || e);
      setError(e?.response?.data?.error || "Failed to load sub-profiles");
    } finally {
      setLoading(false);
    }
  }, [token, parentEmailHash]);



  useEffect(() => {
    if (!isConnected || !token || !parentEmailHash) {
      setSubProfiles([]);
      setActiveIdentityHash(null);
      ownedIdentityRef.parent = null;
      ownedIdentityRef.hashes = new Set();
      setLoading(false);
      return;
    }
    setActiveIdentityHash(null);
    ownedIdentityRef.parent = null;
    ownedIdentityRef.hashes = new Set();
    refreshSubProfiles();
  }, [isConnected, token, parentEmailHash, refreshSubProfiles]);











  useEffect(() => {
    if (!parentEmailHash || subProfiles.length === 0) return;
    const parentHash = parentEmailHash.toLowerCase();
    const healFlag = `subprofile_heal_done_${parentHash}`;
    if (localStorage.getItem(healFlag)) return;

    const parentKeypair = getIdentityKeypair(parentHash);
    if (!parentKeypair) {

      localStorage.setItem(healFlag, "1");
      return;
    }

    const defaultSub = subProfiles[0];
    if (!defaultSub) return;
    const newHash = defaultSub.identityHash.toLowerCase();

    let didAnything = false;

    if (!getIdentityKeypair(newHash)) {
      storeIdentityKeypair(newHash, parentKeypair);
      didAnything = true;
    }


    const prefix = `ratchet_v3_${parentHash}_`;
    const keysToCopy: Array<[string, string]> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const peerHash = k.slice(prefix.length);
      const newKey = `ratchet_v3_${newHash}_${peerHash}`;
      if (!localStorage.getItem(newKey)) {
        keysToCopy.push([k, newKey]);
      }
    }
    for (const [src, dst] of keysToCopy) {
      const val = localStorage.getItem(src);
      if (val) {
        localStorage.setItem(dst, val);
        didAnything = true;
      }
    }

    localStorage.setItem(healFlag, "1");

    
    
    
    
    
    if (didAnything && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mutate:e2ee-keys-ready"));
    }
  }, [parentEmailHash, subProfiles]);

  const switchSubProfile = useCallback(
    (identityHash: string | null) => {
      if (!parentEmailHash) return;
      const parentHash = parentEmailHash.toLowerCase();
      const next =
        identityHash && identityHash !== parentHash ? identityHash.toLowerCase() : parentHash;

      setActiveIdentityHash(next);
      localStorage.setItem(activeSubProfileStorageKey(parentEmailHash), next);
    },
    [parentEmailHash]
  );

  const createSubProfile = useCallback(
    async (
      name: string,
      avatarId: number,
      avatarUrl?: string | null
    ): Promise<SubProfile> => {
      if (!token || !parentEmailHash) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();





      const res = await axios.post(
        `${BACKEND_URL}/subprofiles`,
        { name, avatarId, avatarUrl: avatarUrl || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const created: SubProfile = {
        _id: String(res.data.subProfile._id),
        identityHash: String(res.data.subProfile.identityHash),
        name: res.data.subProfile.name,
        avatarId: res.data.subProfile.avatarId ?? 0,
        avatarUrl: res.data.subProfile.avatarUrl ?? null,
        publicIdentityKey: null,
      };
      const subHash = created.identityHash.toLowerCase();




      let keypair: IdentityKeypair = getIdentityKeypair(subHash) || generateIdentityKeypair();
      if (!getIdentityKeypair(subHash)) {
        storeIdentityKeypair(subHash, keypair);
      }


      try {
        await axios.post(
          `${BACKEND_URL}/auth/oidc/identity-key`,
          { publicIdentityKey: encodeBase64(keypair.encryption.publicKey) },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Identity-Hash": subHash,
            },
          }
        );
      } catch (e: any) {
        console.error("[SubProfile] identity-key upload failed:", e?.message || e);
      }


      try {
        const bundle = generateUserPrekeyBundle(keypair);
        await axios.post(`${BACKEND_URL}/auth/oidc/prekey-bundle`, bundle, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Identity-Hash": subHash,
          },
        });

        const idPK = encodeBase64(keypair.encryption.publicKey);
        localStorage.setItem(`bundle_uploaded_${subHash}_${idPK}`, "true");
      } catch (e: any) {
        console.error("[SubProfile] prekey-bundle upload failed:", e?.message || e);
      }


      setSubProfiles((prev) => [...prev, created]);
      setActiveIdentityHash(subHash);
      localStorage.setItem(activeSubProfileStorageKey(parentEmailHash), subHash);
      notifyPointsMayHaveChanged();

      return created;
    },
    [token, parentEmailHash]
  );

  const updateSubProfile = useCallback(
    async (
      identityHash: string,
      patch: { name?: string; avatarId?: number; avatarUrl?: string | null }
    ): Promise<SubProfile> => {
      if (!token) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();
      const res = await axios.patch(
        `${BACKEND_URL}/subprofiles/${identityHash}`,
        patch,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated: SubProfile = {
        _id: String(res.data.subProfile._id),
        identityHash: res.data.subProfile.identityHash,
        name: res.data.subProfile.name,
        avatarId: res.data.subProfile.avatarId ?? 0,
        avatarUrl: res.data.subProfile.avatarUrl ?? null,
        publicIdentityKey: res.data.subProfile.publicIdentityKey || null,
      };
      setSubProfiles((prev) =>
        prev.map((s) => (s.identityHash === updated.identityHash ? updated : s))
      );
      return updated;
    },
    [token]
  );










  const uploadSubProfileAvatar = useCallback(
    async (
      file: File,
      identityHash?: string | null
    ): Promise<{ avatarUrl: string }> => {
      if (!token) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();
      const form = new FormData();
      form.append("file", file);
      const url = identityHash
        ? `${BACKEND_URL}/subprofiles/${identityHash}/avatar`
        : `${BACKEND_URL}/subprofiles/avatar`;
      const res = await axios.post(url, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const avatarUrl: string = res.data?.avatarUrl;
      if (!avatarUrl) throw new Error("upload_failed");
      if (identityHash && res.data?.subProfile) {
        const updated: SubProfile = {
          _id: String(res.data.subProfile._id),
          identityHash: res.data.subProfile.identityHash,
          name: res.data.subProfile.name,
          avatarId: res.data.subProfile.avatarId ?? 0,
          avatarUrl: res.data.subProfile.avatarUrl ?? null,
          publicIdentityKey: res.data.subProfile.publicIdentityKey || null,
        };
        setSubProfiles((prev) =>
          prev.map((s) =>
            s.identityHash === updated.identityHash ? updated : s
          )
        );
        notifyPointsMayHaveChanged();
      }
      return { avatarUrl };
    },
    [token]
  );

  const deleteSubProfile = useCallback(
    async (identityHash: string): Promise<void> => {
      if (!token || !parentEmailHash) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();
      await axios.delete(`${BACKEND_URL}/subprofiles/${identityHash}`, {
        headers: { Authorization: `Bearer ${token}` },
      });


      const hash = identityHash.toLowerCase();
      try {
        removeIdentityKeypair(hash);
        const prefix = `ratchet_v3_${hash}_`;
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith(prefix) || k.startsWith(`bundle_uploaded_${hash}_`))) {
            toRemove.push(k);
          }
        }
        for (const k of toRemove) localStorage.removeItem(k);
      } catch {}

      setSubProfiles((prev) => prev.filter((s) => s.identityHash !== hash));
      ownedIdentityRef.hashes.delete(hash);




      if (activeIdentityHash === hash) {
        const remaining = subProfiles.filter((s) => s.identityHash !== hash);
        const next = remaining[0]?.identityHash.toLowerCase() ?? parentEmailHash.toLowerCase();
        setActiveIdentityHash(next);
        localStorage.setItem(activeSubProfileStorageKey(parentEmailHash), next);
      }
    },
    [token, parentEmailHash, activeIdentityHash, subProfiles]
  );

  const activeSubProfile = useMemo<SubProfile | null>(() => {
    if (!activeIdentityHash || !parentEmailHash) return null;
    if (activeIdentityHash === parentEmailHash.toLowerCase()) return null;
    return subProfiles.find((s) => s.identityHash === activeIdentityHash) || null;
  }, [activeIdentityHash, parentEmailHash, subProfiles]);

  const value: SubProfileContextType = useMemo(
    () => ({
      subProfiles,
      activeSubProfile,
      activeIdentityHash: activeIdentityHash || parentEmailHash || null,
      isParentActive:
        !!parentEmailHash &&
        (!activeIdentityHash || activeIdentityHash === parentEmailHash.toLowerCase()),
      loading,
      error,
      switchSubProfile,
      createSubProfile,
      updateSubProfile,
      deleteSubProfile,
      refreshSubProfiles,
      uploadSubProfileAvatar,
    }),
    [
      subProfiles,
      activeSubProfile,
      activeIdentityHash,
      parentEmailHash,
      loading,
      error,
      switchSubProfile,
      createSubProfile,
      updateSubProfile,
      deleteSubProfile,
      refreshSubProfiles,
      uploadSubProfileAvatar,
    ]
  );

  return <SubProfileContext.Provider value={value}>{children}</SubProfileContext.Provider>;
}

export function useSubProfile() {
  const ctx = useContext(SubProfileContext);
  if (!ctx) throw new Error("useSubProfile must be used within SubProfileProvider");
  return ctx;
}





export function getActiveIdentityHashSnapshot(): string | null {
  return activeIdentityRef.current;
}
