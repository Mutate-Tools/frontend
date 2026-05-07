"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import axios from "axios";
import { encodeBase64 } from "tweetnacl-util";
import {
  generateIdentityKeypair,
  storeIdentityKeypair,
  getIdentityKeypair,
  IdentityKeypair,
} from "@/src/utils/crypto/identity-util";
import { generateUserPrekeyBundle } from "@/src/utils/crypto/x3dh-util";
import { getBackendUrl } from '@/src/utils/backend-url';
import { notifyPointsMayHaveChanged } from "@/src/utils/point-meta";

export interface UserProfile {
  emailHash: string;
  username: string | null;
  walletAddress: string | null;
  avatarId: number;
  avatarUrl?: string | null;
  publicIdentityKey: string | null;
  needsProfileCompletion: boolean;

  referralCode?: string | null;
  referredBy?: string | null;
  chatPoints?: number;
  mpEarningDisabled?: boolean;
  referralPoints?: number;
  totalReferrals?: number;

  
  claimableMuteBalance?: number;
  lockedMuteBalance?: number;
  paidMuteBalance?: number;

  
  qualificationStatus?: "not_started" | "stage_1" | "stage_2" | "stage_3" | "qualified";
  ambassadorTier?: "none" | "explorer" | "operator" | "catalyst" | "architect";
}

interface AuthContextType {
  emailHash: string | null;
  token: string | null;
  profile: UserProfile | null;
  isConnected: boolean;
  needsProfileCompletion: boolean;
  loading: boolean;
  error: string | null;
  disconnect: () => void;
  loginWithIdToken: (idToken: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: {
    username?: string;
    walletAddress?: string | null;
    avatarId?: number;
    avatarUrl?: string | null;
  }) => Promise<UserProfile>;
  uploadProfileAvatar: (file: File) => Promise<{ avatarUrl: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


const getReferralDeviceHeaders = () => {
  if (typeof window === "undefined") return {};
  const storageKey = "mutate_referral_device_id";
  let deviceId = localStorage.getItem(storageKey);
  if (!deviceId) {
    deviceId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(storageKey, deviceId);
  }
  return { "X-Referral-Device": deviceId };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [emailHash, setEmailHash] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ensuredIdentityRef = useRef(false);

  
  
  
  
  
  
  
  
  const ensureIdentityKey = useCallback(
    async (hash: string, authToken: string, allowGenerate: boolean) => {
      const BACKEND_URL = getBackendUrl();
      let keypair = getIdentityKeypair(hash);
      if (!keypair) {
        if (!allowGenerate) return null;
        keypair = generateIdentityKeypair();
        storeIdentityKeypair(hash, keypair);
        try {
          await axios.post(
            `${BACKEND_URL}/auth/oidc/identity-key`,
            { publicIdentityKey: encodeBase64(keypair.encryption.publicKey) },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
        } catch (e) {
          console.error("[Auth] Failed to register identity key:", e);
          return null;
        }
      }
      return keypair;
    },
    []
  );

  const ensurePrekeyBundle = useCallback(
    async (hash: string, authToken: string, identityKeypair: IdentityKeypair) => {
      const BACKEND_URL = getBackendUrl();
      const idPK = encodeBase64(identityKeypair.encryption.publicKey);
      const uploadKey = `bundle_uploaded_${hash}_${idPK}`;
      if (localStorage.getItem(uploadKey)) return;
      try {
        const bundle = generateUserPrekeyBundle(identityKeypair);
        await axios.post(`${BACKEND_URL}/auth/oidc/prekey-bundle`, bundle, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        localStorage.setItem(uploadKey, "true");
      } catch (e) {
        console.error("[Auth] Failed to upload prekey bundle:", e);
      }
    },
    []
  );

  const fetchProfile = useCallback(async (authToken: string): Promise<UserProfile | null> => {
    const BACKEND_URL = getBackendUrl();
    try {
      const res = await axios.get(`${BACKEND_URL}/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.data as UserProfile;
    } catch (e) {
      console.error("[Auth] fetchProfile failed", e);
      return null;
    }
  }, []);

  
  
  
  
  
  
  
  
  
  
  const bootstrapAuth = useCallback(
    async (hash: string, authToken: string): Promise<UserProfile | null> => {
      const profileData = await fetchProfile(authToken);
      if (profileData) setProfile(profileData);

      const isBrandNewAccount = !!profileData && !profileData.username;
      const idKp = await ensureIdentityKey(hash, authToken, isBrandNewAccount);
      if (idKp) await ensurePrekeyBundle(hash, authToken, idKp);

      return profileData;
    },
    [fetchProfile, ensureIdentityKey, ensurePrekeyBundle]
  );

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const p = await fetchProfile(token);
    if (p) setProfile(p);
  }, [token, fetchProfile]);

  const updateProfile = useCallback(
    async (patch: { username?: string; walletAddress?: string | null; avatarId?: number; avatarUrl?: string | null }) => {
      if (!token) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();
      const res = await axios.patch(`${BACKEND_URL}/users/me`, patch, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = res.data as UserProfile;
      setProfile(updated);
      return updated;
    },
    [token]
  );

  const uploadProfileAvatar = useCallback(
    async (file: File) => {
      if (!token) throw new Error("Not authenticated");
      const BACKEND_URL = getBackendUrl();
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${BACKEND_URL}/users/me/avatar`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const avatarUrl: string = res.data?.avatarUrl;
      if (!avatarUrl) throw new Error("upload_failed");
      if (res.data?.profile) setProfile(res.data.profile as UserProfile);
      notifyPointsMayHaveChanged();
      return { avatarUrl };
    },
    [token]
  );

  const loginWithIdToken = useCallback(
    async (idToken: string) => {
      const BACKEND_URL = getBackendUrl();
      try {
        setLoading(true);
        setError(null);

        const res = await axios.post(`${BACKEND_URL}/auth/oidc/google`, { idToken }, {
          headers: getReferralDeviceHeaders(),
        });
        const { token: jwtToken, emailHash: hash } = res.data;

        setToken(jwtToken);
        setEmailHash(hash);
        localStorage.setItem("auth_token", jwtToken);
        localStorage.setItem("auth_email_hash", hash);

        ensuredIdentityRef.current = true;
        await bootstrapAuth(hash, jwtToken);
      } catch (err: any) {
        console.error("[Auth] Login failed:", err);
        setError(err.response?.data?.error || err.message || "Google Login failed");
      } finally {
        setLoading(false);
      }
    },
    [bootstrapAuth]
  );

  const handleRedirectResult = useCallback(async (): Promise<boolean> => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlEmailHash = params.get("emailHash");



    const refCode = params.get("ref");
    if (refCode && !localStorage.getItem("pending_ref")) {
      localStorage.setItem("pending_ref", refCode);
    }

    if (urlToken && urlEmailHash) {
      setToken(urlToken);
      setEmailHash(urlEmailHash);
      localStorage.setItem("auth_token", urlToken);
      localStorage.setItem("auth_email_hash", urlEmailHash);

      ensuredIdentityRef.current = true;
      await bootstrapAuth(urlEmailHash, urlToken);

      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      url.searchParams.delete("emailHash");
      url.searchParams.delete("authType");
      url.searchParams.delete("ref");
      window.history.replaceState({}, document.title, url.pathname + (url.search || "") + url.hash);
      return true;
    } else if (refCode) {

      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState({}, document.title, url.pathname + (url.search || "") + url.hash);
    }
    return false;
  }, [bootstrapAuth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const handledRedirect = await handleRedirectResult();
      if (cancelled) return;
      if (handledRedirect) {
        setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem("auth_token");
      const storedHash = localStorage.getItem("auth_email_hash");
      if (storedToken && storedHash) {
        setToken(storedToken);
        setEmailHash(storedHash);
      } else {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleRedirectResult]);

  useEffect(() => {
    if (!token || !emailHash || ensuredIdentityRef.current) return;
    ensuredIdentityRef.current = true;
    bootstrapAuth(emailHash, token).finally(() => setLoading(false));
  }, [token, emailHash, bootstrapAuth]);


  const attachedRefRef = useRef(false);
  useEffect(() => {
    if (attachedRefRef.current) return;
    if (!token || !emailHash || !profile) return;
    if (profile.referredBy) {
      localStorage.removeItem("pending_ref");
      return;
    }
    const pending = localStorage.getItem("pending_ref");
    if (!pending) return;
    attachedRefRef.current = true;
    axios
      .post(
        `${getBackendUrl()}/referrals/attach`,
        { code: pending },
        { headers: { Authorization: `Bearer ${token}`, ...getReferralDeviceHeaders() } }
      )
      .then(() => {
        localStorage.removeItem("pending_ref");
        fetchProfile(token).then((p) => { if (p) { setProfile(p); notifyPointsMayHaveChanged(); } });
      })
      .catch((e) => {
        const status = e?.response?.status;
        if (status === 400 || status === 404 || status === 409) {
          localStorage.removeItem("pending_ref");
        } else {

          attachedRefRef.current = false;
        }
      });
  }, [token, emailHash, profile, fetchProfile]);

  const disconnect = useCallback(() => {
    setEmailHash(null);
    setToken(null);
    setProfile(null);
    ensuredIdentityRef.current = false;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_email_hash");
    localStorage.removeItem("auth_type");
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      emailHash,
      token,
      profile,
      isConnected: !!token,
      needsProfileCompletion: !!profile && !profile.username,
      loading,
      error,
      disconnect,
      loginWithIdToken,
      refreshProfile,
      updateProfile,
      uploadProfileAvatar,
    }),
    [
      emailHash,
      token,
      profile,
      loading,
      error,
      disconnect,
      loginWithIdToken,
      refreshProfile,
      updateProfile,
      uploadProfileAvatar,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
