"use client";

import { useEffect, useState } from "react";
import { FiSearch, FiLoader } from "react-icons/fi";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import { useSubProfile } from "../contexts/SubProfileContext";
import { useChatStore } from "../state/chat-store";
import env from "../constants/environment";
import { getBackendUrl } from '@/src/utils/backend-url';

interface SearchUser {
  emailHash: string;
  username: string | null;
  avatarId?: number;
  avatarUrl?: string | null;
  publicIdentityKey?: string | null;
}

interface FriendRequestStatus {
  status:
    | "pending_sent"
    | "pending_received"
    | "accepted"
    | "rejected"
    | "friends"
    | "blocked_by_me"
    | "blocked_by_them"
    | "none";
  requestId?: string;
}


const AddFriend = ({ onClose }: { onClose: () => void }) => {
  const { token } = useAuth();
  const { setSelectedChat } = useChat();
  const { activeSubProfile } = useSubProfile();
  const { setActiveInbox } = useChatStore();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendStatus, setFriendStatus] = useState<Record<string, FriendRequestStatus>>({});
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!search.trim() || !token) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${getBackendUrl()}/users/search?q=${encodeURIComponent(search.trim())}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              ...(activeSubProfile?.identityHash && { "X-Identity-Hash": activeSubProfile.identityHash })
            }
          }
        );
        const users = res.data.users || [];
        setResults(users);

        
        for (const user of users) {
          checkFriendStatus(user.emailHash);
        }
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, token, activeSubProfile]);

  const checkFriendStatus = async (targetHash: string) => {
    try {
      const res = await axios.get(
        `${getBackendUrl()}/friends/request/status/${targetHash}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(activeSubProfile?.identityHash && { "X-Identity-Hash": activeSubProfile.identityHash })
          }
        }
      );
      setFriendStatus((prev) => ({
        ...prev,
        [targetHash]: res.data,
      }));
    } catch (error) {
      console.error("[addFriend] Error checking friend status:", error);
    }
  };

  const handleSendFriendRequest = async (user: SearchUser) => {
    try {
      setSendingRequest(user.emailHash);
      await axios.post(
        `${getBackendUrl()}/friends/request`,
        { targetHash: user.emailHash.toLowerCase() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(activeSubProfile?.identityHash && { "X-Identity-Hash": activeSubProfile.identityHash })
          }
        }
      );
      toast.success("Friend request sent!");
      
      await checkFriendStatus(user.emailHash);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || "Failed to send friend request";
      toast.error(errMsg);
      console.error("[addFriend] Error sending request:", error);
    } finally {
      setSendingRequest(null);
    }
  };

  const handleCancelRequest = async (requestId: string, userHash: string) => {
    try {
      setSendingRequest(userHash);
      await axios.delete(
        `${getBackendUrl()}/friends/request/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(activeSubProfile?.identityHash && { "X-Identity-Hash": activeSubProfile.identityHash })
          }
        }
      );
      toast.success("Friend request cancelled");
      
      await checkFriendStatus(userHash);
    } catch (error) {
      toast.error("Failed to cancel request");
      console.error("[addFriend] Error cancelling request:", error);
    } finally {
      setSendingRequest(null);
    }
  };

  const handleUnblock = async (user: SearchUser) => {
    try {
      setSendingRequest(user.emailHash);
      await axios.post(
        `${getBackendUrl()}/friends/unblock`,
        { targetHash: user.emailHash.toLowerCase() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(activeSubProfile?.identityHash && { "X-Identity-Hash": activeSubProfile.identityHash })
          }
        }
      );
      toast.success("User unblocked");
      await checkFriendStatus(user.emailHash);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to unblock user");
      console.error("[addFriend] Error unblocking user:", error);
    } finally {
      setSendingRequest(null);
    }
  };

  const startDM = (user: SearchUser) => {
    setSelectedChat({ type: "dm", otherHash: user.emailHash.toLowerCase() });
    setActiveInbox(true);
    onClose();
  };

  const getButtonLabel = (user: SearchUser): string => {
    const status = friendStatus[user.emailHash];
    if (!status) return "Add Friend";
    switch (status.status) {
      case "pending_sent":
        return "Cancel Request";
      case "pending_received":
        return "Request Pending";
      case "friends":
        return "Message";
      case "blocked_by_me":
        return "Unblock";
      case "blocked_by_them":
        return "Unavailable";
      case "rejected":
        return "Add Friend";
      default:
        return "Add Friend";
    }
  };

  const handleUserAction = (user: SearchUser) => {
    const status = friendStatus[user.emailHash];
    if (!status || status.status === "none" || status.status === "rejected") {
      handleSendFriendRequest(user);
    } else if (status.status === "pending_sent" && status.requestId) {
      
      handleCancelRequest(status.requestId, user.emailHash);
    } else if (status.status === "friends") {
      startDM(user);
    } else if (status.status === "blocked_by_me") {
      handleUnblock(user);
    }
    
  };

  return (
    <div className="mt-4 text-white">
      <button onClick={onClose} className="mb-3 max-lg:hidden text-[24px]">
        ← Add Friend
      </button>

      <div className="max-w-[345px] w-full bg-[#FFFFFF1A] max-lg:mx-auto border border-white/30 p-[10px] rounded-[20px]">
        <div className="mt-3 h-[38px] w-full border border-[#EAF0FF1A] rounded-full flex items-center gap-2 px-4">
          <FiSearch className="text-[#9AA4C7]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username"
            className="bg-transparent w-full outline-none text-[12px] text-white placeholder-[#9AA4C7]"
          />
        </div>
      </div>

      {search.trim() !== "" && (
        <div className="mt-3 max-w-[345px] max-lg:mx-auto w-full">
          <p className="mb-2 text-[14px] font-spaceGrotesk text-[#FFFFFF] tracking-wide">
            {loading ? "Searching…" : "Results"}
          </p>

          {loading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[58px] rounded-[14px] bg-white/5 animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="p-4 text-center bg-white/[0.03] border border-white/10 rounded-[14px]">
              <p className="text-sm text-white/60">No users found</p>
              <p className="text-xs text-white/40 mt-1">
                Try a different username
              </p>
            </div>
          )}

          {!loading &&
            results.map((user) => {
              const status = friendStatus[user.emailHash];
              const isLoading = sendingRequest === user.emailHash;
              const isPendingSent = status?.status === "pending_sent";
              const isPendingReceived = status?.status === "pending_received";
              const isFriend = status?.status === "friends";
              const isBlockedByMe = status?.status === "blocked_by_me";
              const isBlockedByThem = status?.status === "blocked_by_them";

              const buttonLabel = getButtonLabel(user);
              const buttonClasses = isPendingSent
                ? "bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/25"
                : isPendingReceived
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/30 cursor-not-allowed"
                  : isFriend
                    ? "bg-green-500/15 text-green-300 border border-green-500/30 hover:bg-green-500/25"
                    : isBlockedByMe
                      ? "bg-red-500/15 text-red-200 border border-red-500/30 hover:bg-red-500/25"
                      : isBlockedByThem
                        ? "bg-white/5 text-white/35 border border-white/10 cursor-not-allowed"
                        : "bg-[#3730EA] text-white hover:bg-[#4B45F0] border border-transparent";

              return (
                <div
                  key={user.emailHash}
                  className="group p-3 bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 rounded-[14px] flex items-center justify-between my-2 transition"
                >
                  <div className="flex items-center gap-[10px] min-w-0">
                    <div className="w-[36px] h-[36px] rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={
                          env.GROUP_AVATARS?.[user.avatarId ?? 0] ||
                          env.GROUP_AVATARS?.[0]
                        }
                        alt={user.username || "Profile"}
                        width={36}
                        height={36}
                        className="object-cover rounded-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white truncate">
                        {user.username || user.emailHash.slice(0, 10) + "…"}
                      </p>
                      {isPendingSent && (
                        <p className="text-[10px] text-orange-300/80 mt-0.5">
                          Awaiting response
                        </p>
                      )}
                      {isPendingReceived && (
                        <p className="text-[10px] text-blue-300/80 mt-0.5">
                          Sent you a request
                        </p>
                      )}
                      {isFriend && (
                        <p className="text-[10px] text-green-300/80 mt-0.5">
                          You are friends
                        </p>
                      )}
                      {isBlockedByMe && (
                        <p className="text-[10px] text-red-200/80 mt-0.5">
                          Blocked
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={isLoading || isPendingReceived || isBlockedByThem}
                    className={`flex-shrink-0 text-[10px] font-semibold px-3.5 py-1.5 rounded-full active:scale-95 flex items-center gap-1 transition ${buttonClasses} ${
                      isLoading ? "opacity-70" : ""
                    }`}
                    onClick={() => handleUserAction(user)}
                  >
                    {isLoading && <FiLoader size={11} className="animate-spin" />}
                    {buttonLabel}
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default AddFriend;
