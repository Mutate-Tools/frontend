"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FiVolumeX, FiVolume2 } from "react-icons/fi";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";
import { useChat } from "@/src/contexts/ChatContext";
import { useChatStore } from "@/src/state/chat-store";
import Avatar from "./avatar";
import { getBackendUrl } from '@/src/utils/backend-url';

interface Friend {
  friendHash: string;
  username: string;
  avatarId?: number;
  avatarUrl?: string | null;
  lastChatAt?: string;
  isMuted: boolean;
}


const formatLastChat = (lastChatAt?: string): string => {
  if (!lastChatAt) return "";
  const date = new Date(lastChatAt);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Last chat just now";
  if (diffMin < 60) return `Last chat ${diffMin}m ago`;
  if (diffHr < 24) return `Last chat ${diffHr}h ago`;
  if (diffDay < 7) return `Last chat ${diffDay}d ago`;
  return `Last chat ${date.toLocaleDateString()}`;
};

interface FriendsListProps {
  onMuteToggle?: (friendHash: string, isMuted: boolean) => Promise<void>;
  onCountChange?: (count: number) => void;
  onFriendOpen?: () => void;
}

export default function FriendsList({
  onMuteToggle,
  onCountChange,
  onFriendOpen,
}: FriendsListProps) {
  const { token } = useAuth();
  const { activeSubProfile } = useSubProfile();
  const { setSelectedChat, selectedChat } = useChat();
  const { setActiveInbox } = useChatStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [muteLoading, setMuteLoading] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!token || !activeSubProfile?.identityHash) return;
    try {
      setLoading(true);
      const res = await axios.get(`${getBackendUrl()}/friends`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Identity-Hash": activeSubProfile.identityHash,
        },
      });
      const nextFriends = res.data || [];
      setFriends(nextFriends);
      onCountChange?.(nextFriends.length);
    } catch (err) {
      console.error("[FriendsList] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, activeSubProfile?.identityHash, onCountChange]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  
  useEffect(() => {
    const onFriendChanged = () => fetchFriends();
    const onDMActivity = (event: Event) => {
      const detail = (event as CustomEvent<{ otherHash?: string; lastChatAt?: string }>).detail;
      const otherHash = String(detail?.otherHash || "").toLowerCase();
      const lastChatAt = detail?.lastChatAt;
      if (!otherHash || !lastChatAt) return;
      setFriends((prev) => {
        let changed = false;
        const next = prev.map((friend) => {
          if (friend.friendHash.toLowerCase() !== otherHash) return friend;
          changed = true;
          return { ...friend, lastChatAt };
        });
        if (!changed) return prev;
        next.sort((a, b) => {
          const aTime = a.lastChatAt ? new Date(a.lastChatAt).getTime() : 0;
          const bTime = b.lastChatAt ? new Date(b.lastChatAt).getTime() : 0;
          return bTime - aTime;
        });
        return next;
      });
    };
    window.addEventListener("friend:connected", onFriendChanged);
    window.addEventListener("friend:blocked", onFriendChanged);
    window.addEventListener("friend:unblocked", onFriendChanged);
    window.addEventListener("chat:dm-activity", onDMActivity);
    return () => {
      window.removeEventListener("friend:connected", onFriendChanged);
      window.removeEventListener("friend:blocked", onFriendChanged);
      window.removeEventListener("friend:unblocked", onFriendChanged);
      window.removeEventListener("chat:dm-activity", onDMActivity);
    };
  }, [fetchFriends]);

  const openChat = (friendHash: string) => {
    const normalizedHash = friendHash.toLowerCase();
    const friend = friends.find((f) => f.friendHash.toLowerCase() === normalizedHash);
    if (friend) {
      const preview = {
        emailHash: normalizedHash,
        username: friend.username,
        avatarId: friend.avatarId,
        avatarUrl: friend.avatarUrl,
      };
      try {
        sessionStorage.setItem(
          `mutate_chat_user_preview:${normalizedHash}`,
          JSON.stringify(preview)
        );
      } catch {}
      window.dispatchEvent(
        new CustomEvent("chat:user-preview", {
          detail: preview,
        })
      );
    }
    setSelectedChat({ type: "dm", otherHash: normalizedHash });
    setActiveInbox(true);
    onFriendOpen?.();
  };

  const handleMuteToggle = async (
    e: React.MouseEvent,
    friendHash: string,
    currentMuted: boolean
  ) => {
    e.stopPropagation();
    try {
      setMuteLoading(friendHash);
      if (onMuteToggle) await onMuteToggle(friendHash, !currentMuted);
      setFriends((prev) =>
        prev.map((f) =>
          f.friendHash === friendHash ? { ...f, isMuted: !f.isMuted } : f
        )
      );
    } catch (err) {
      console.error("[FriendsList] mute error:", err);
    } finally {
      setMuteLoading(null);
    }
  };

  
  if (loading && friends.length === 0) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-white/50 font-semibold tracking-wider">
            FRIENDS
          </p>
        </div>
        <div className="space-y-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return null; 
  }

  return (
    <div className="px-2 py-2">
      <div className="flex items-center justify-between mb-1 px-2">
        <p className="text-[11px] text-white/50 font-semibold tracking-wider">
          FRIENDS
        </p>
        <span className="text-[10px] text-white/40 font-medium">
          {friends.length}
        </span>
      </div>

      <div className="space-y-0.5">
        {friends.map((friend) => {
          const isActive =
            selectedChat?.type === "dm" &&
            selectedChat.otherHash === friend.friendHash.toLowerCase();
          const lastChat = formatLastChat(friend.lastChatAt);

          return (
            <div
              key={friend.friendHash}
              onClick={() => openChat(friend.friendHash)}
              className={`group flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition ${
                isActive
                  ? "bg-[#3730EA]/20 border border-[#3730EA]/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <Avatar
                url={friend.avatarUrl}
                avatarId={friend.avatarId}
                name={friend.username}
                hash={friend.friendHash}
                size={32}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p
                    className={`text-[13px] font-medium truncate ${
                      isActive ? "text-white" : "text-white/90"
                    }`}
                  >
                    {friend.username}
                  </p>
                  {friend.isMuted && (
                    <FiVolumeX
                      className="text-white/40 flex-shrink-0"
                      size={11}
                    />
                  )}
                </div>
                {lastChat && (
                  <p className="text-[10px] text-white/40 truncate">
                    {lastChat}
                  </p>
                )}
              </div>

              {}
              {onMuteToggle && (
                <button
                  onClick={(e) =>
                    handleMuteToggle(e, friend.friendHash, friend.isMuted)
                  }
                  disabled={muteLoading === friend.friendHash}
                  aria-label={friend.isMuted ? "Unmute" : "Mute"}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition flex-shrink-0 ${
                    friend.isMuted
                      ? "text-orange-300 bg-orange-500/15 hover:bg-orange-500/25"
                      : "opacity-0 group-hover:opacity-100 text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {friend.isMuted ? (
                    <FiVolumeX size={13} />
                  ) : (
                    <FiVolume2 size={13} />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
