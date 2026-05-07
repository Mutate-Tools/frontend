"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import env from "@/src/constants/environment";
import { useAuth } from "@/src/contexts/AuthContext";
import { useChat, GroupDoc } from "@/src/contexts/ChatContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";
import JoinRequestConfirm from "@/src/components/joinRequestConfirm";

const getBackendUrl = () => {
  if (typeof window === "undefined") return "http://localhost:8080";
  return (
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8080`
  );
};

export default function GroupSharePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isConnected } = useAuth();
  const { joinGroupByShareToken, setSelectedChat } = useChat();
  const { activeIdentityHash, activeSubProfile, loading: subProfilesLoading } = useSubProfile();

  const [group, setGroup] = useState<GroupDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pinnedIdentityHash, setPinnedIdentityHash] = useState<string | null>(null);
  const [pinnedSubProfileName, setPinnedSubProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await axios.get(
          `${getBackendUrl()}/groups/share/${encodeURIComponent(String(token))}`,
          { signal: controller.signal }
        );
        setGroup(res.data.group as GroupDoc);
      } catch (e: any) {
        if (!axios.isCancel(e)) setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [token]);

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

  const myHash = (pinnedIdentityHash || "").toLowerCase();
  const isMember = !!group?.members?.some((m) => m.emailHash.toLowerCase() === myHash);
  const isPendingRequest = !!group?.pendingMembers?.some(
    (m) => m.emailHash.toLowerCase() === myHash
  );
  const activeChanged =
    !!pinnedIdentityHash &&
    !!activeIdentityHash &&
    activeIdentityHash.toLowerCase() !== pinnedIdentityHash;

  const performJoin = async () => {
    if (!group) return;
    try {
      setJoining(true);
      if (!pinnedIdentityHash || activeChanged) {
        toast.error("Open this invite again after switching to the subprofile you want to use.");
        return;
      }
      const result = await joinGroupByShareToken(String(token), {
        identityHash: pinnedIdentityHash,
      });
      if (result.status === "joined" || result.status === "already-member") {
        toast.success("Joined group");
        setSelectedChat({ type: "group", groupId: result.group._id });
        router.push("/chat/inbox");
      } else {
        toast.success("Request sent to admins");
        setGroup(result.group);
        setConfirmOpen(false);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message || "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  const handleJoin = async () => {
    if (!group) return;
    if (!isConnected) {
      const redirectTo = `/g/${encodeURIComponent(String(token))}`;
      try {
        sessionStorage.setItem("post_login_redirect", redirectTo);
      } catch {}
      router.push("/chat");
      return;
    }
    if (subProfilesLoading || !pinnedIdentityHash) {
      toast.error("Select a subprofile before joining this group.");
      return;
    }
    if (activeChanged) {
      toast.error("Open this invite again after switching to the subprofile you want to use.");
      return;
    }
    if (isMember) {
      setSelectedChat({ type: "group", groupId: group._id });
      router.push("/chat/inbox");
      return;
    }
    if (!group.isPublic) {
      setConfirmOpen(true);
      return;
    }
    await performJoin();
  };

  const ctaLabel = (() => {
    if (!isConnected) return "Sign in to Join";
    if (subProfilesLoading) return "Loading Profile…";
    if (!pinnedIdentityHash) return "Select Subprofile";
    if (activeChanged) return "Reopen Invite";
    if (isMember) return "Open Group";
    if (isPendingRequest) return "Request Pending";
    if (group?.isPublic) return "Join Group";
    return "Request to Join";
  })();

  return (
    <div className="min-h-screen bg-[#0F0F14] flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-[#FFFFFF0D] border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4">
        {loading && <span className="text-white/70 text-sm">Loading group…</span>}

        {!loading && notFound && (
          <>
            <h2 className="text-white text-xl font-semibold">Group not found</h2>
            <p className="text-white/60 text-sm text-center">
              This invite link is invalid or has been revoked.
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="mt-4 px-6 py-2 rounded-full bg-[#3730EA] text-white text-sm"
            >
              Back to app
            </button>
          </>
        )}

        {!loading && group && (
          <>
            <Image
              src={env.GROUP_AVATARS?.[group.avatarId ?? 0] || env.GROUP_AVATARS?.[0]}
              alt={group.name}
              width={96}
              height={96}
              className="rounded-full"
            />
            <h2 className="text-white text-2xl font-semibold text-center">{group.name}</h2>
            <span className="text-[11px] text-white px-3 py-1 rounded-full bg-[#3730EA]">
              {group.isPublic ? "Public" : "Private"}
            </span>
            {group.description && (
              <p className="text-white/70 text-sm text-center">{group.description}</p>
            )}
            <span className="text-white/50 text-xs">
              {group.members?.length || 0} members
            </span>
            {isConnected && pinnedSubProfileName && (
              <span className="text-white/60 text-xs text-center">
                Joining as {pinnedSubProfileName}
              </span>
            )}
            {activeChanged && (
              <p className="text-[#FCA5A5] text-xs text-center">
                This invite was opened for another subprofile. Switch first, then open the invite in a new tab.
              </p>
            )}
            <button
              onClick={handleJoin}
              disabled={joining || isPendingRequest || subProfilesLoading || activeChanged}
              className="mt-4 w-full h-12 rounded-full bg-[#3730EA] text-white font-medium hover:bg-[#4338CA] transition disabled:opacity-60"
              style={{
                boxShadow:
                  "inset 0 0 2px #FFFFFF, inset 0 0 6px #A19DFF, inset 0 2px 10px #3730EA",
              }}
            >
              {joining ? "Joining…" : ctaLabel}
            </button>
          </>
        )}
      </div>

      {confirmOpen && group && (
        <JoinRequestConfirm
          group={group}
          submitting={joining}
          onConfirm={performJoin}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
