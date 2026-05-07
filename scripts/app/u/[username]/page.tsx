"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import env from "@/src/constants/environment";
import { useAuth } from "@/src/contexts/AuthContext";
import { useChat } from "@/src/contexts/ChatContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";

const getBackendUrl = () => {
  if (typeof window === "undefined") return "http://localhost:8080";
  return (
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8080`
  );
};

interface PublicProfile {
  emailHash: string;
  username: string | null;
  avatarId: number;
  avatarUrl?: string | null;
  publicIdentityKey: string | null;
}

export default function UsernamePreviewPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { isConnected } = useAuth();
  const { setSelectedChat } = useChat();
  const { activeIdentityHash, activeSubProfile, loading: subProfilesLoading } = useSubProfile();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pinnedIdentityHash, setPinnedIdentityHash] = useState<string | null>(null);
  const [pinnedSubProfileName, setPinnedSubProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await axios.get(
          `${getBackendUrl()}/profiles/${encodeURIComponent(String(username).toLowerCase())}`,
          { signal: controller.signal }
        );
        setProfile(res.data.profile as PublicProfile);
      } catch (e: any) {
        if (e?.response?.status === 404) setNotFound(true);
        else if (!axios.isCancel(e)) setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [username]);

  useEffect(() => {
    if (!isConnected || subProfilesLoading || pinnedIdentityHash || !activeIdentityHash) return;
    setPinnedIdentityHash(activeIdentityHash.toLowerCase());
    setPinnedSubProfileName(activeSubProfile?.name || "active subprofile");
  }, [
    activeIdentityHash,
    activeSubProfile?.name,
    isConnected,
    pinnedIdentityHash,
    subProfilesLoading,
  ]);

  const activeChanged =
    !!pinnedIdentityHash &&
    !!activeIdentityHash &&
    activeIdentityHash.toLowerCase() !== pinnedIdentityHash;

  const handleStartConversation = () => {
    if (!profile) return;
    if (!isConnected) {
      const redirectTo = `/u/${encodeURIComponent(String(username))}`;
      try {
        sessionStorage.setItem("post_login_redirect", redirectTo);
      } catch {}
      router.push("/chat");
      return;
    }
    if (subProfilesLoading || !pinnedIdentityHash) {
      toast.error("Select a subprofile before starting a chat.");
      return;
    }
    if (activeChanged) {
      toast.error("Open this profile again after switching to the subprofile you want to use.");
      return;
    }
    if (profile.emailHash.toLowerCase() === pinnedIdentityHash) {
      toast("That's you — pick someone else.");
      return;
    }
    setSelectedChat({ type: "dm", otherHash: profile.emailHash.toLowerCase() });
    router.push("/chat/inbox");
  };

  return (
    <div className="min-h-screen bg-[#0F0F14] flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-[#FFFFFF0D] border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4">
        {loading && <span className="text-white/70 text-sm">Loading profile…</span>}

        {!loading && notFound && (
          <>
            <h2 className="text-white text-xl font-semibold">Profile not found</h2>
            <p className="text-white/60 text-sm text-center">
              No user exists with the username @{username}.
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="mt-4 px-6 py-2 rounded-full bg-[#3730EA] text-white text-sm"
            >
              Back to app
            </button>
          </>
        )}

        {!loading && profile && (
          <>
            <Image
              src={profile.avatarUrl || env.GROUP_AVATARS?.[profile.avatarId ?? 0] || env.GROUP_AVATARS?.[0]}
              alt={profile.username || "Profile"}
              width={96}
              height={96}
              className="rounded-full"
              unoptimized={!!profile.avatarUrl}
            />
            <h2 className="text-white text-2xl font-semibold">
              @{profile.username || "anonymous"}
            </h2>
            <p className="text-white/50 text-xs font-mono break-all text-center">
              {profile.emailHash.slice(0, 16)}…
            </p>
            {isConnected && pinnedSubProfileName && (
              <span className="text-white/60 text-xs text-center">
                Messaging as {pinnedSubProfileName}
              </span>
            )}
            {activeChanged && (
              <p className="text-[#FCA5A5] text-xs text-center">
                This profile was opened for another subprofile. Switch first, then open the profile in a new tab.
              </p>
            )}
            <button
              onClick={handleStartConversation}
              disabled={subProfilesLoading || activeChanged}
              className="mt-4 w-full h-12 rounded-full bg-[#3730EA] text-white font-medium hover:bg-[#4338CA] transition"
              style={{
                boxShadow:
                  "inset 0 0 2px #FFFFFF, inset 0 0 6px #A19DFF, inset 0 2px 10px #3730EA",
              }}
            >
              {!isConnected
                ? "Sign in to Message"
                : subProfilesLoading
                  ? "Loading Profile…"
                  : activeChanged
                    ? "Reopen Profile"
                    : "Start Conversation"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
