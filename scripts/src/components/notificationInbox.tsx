"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiBell, FiX, FiCheck, FiUserPlus, FiMessageCircle } from "react-icons/fi";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";
import { useChat } from "@/src/contexts/ChatContext";
import { useChatStore } from "@/src/state/chat-store";
import Avatar from "./avatar";
import { getBackendUrl } from '@/src/utils/backend-url';

type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "friend_request_cancelled";

interface Notification {
  notificationId: string;
  type: NotificationType;
  title: string;
  status: "unread" | "read";
  relatedUserHash: string;
  createdAt: string;
  readAt?: string;
  actionData?: {
    requestId?: string;
    senderHash?: string;
    senderName?: string;
    senderAvatar?: string | null;
    senderAvatarId?: number;
    friendHash?: string;
    receiverName?: string;
    receiverAvatar?: string | null;
    receiverAvatarId?: number;
    [key: string]: any;
  };
}

interface NotificationInboxProps {
  isOpen: boolean;
  onClose: () => void;
}



const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 30) return "Just now";
  if (diffMin < 1) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationInbox({
  isOpen,
  onClose,
}: NotificationInboxProps) {
  const { token } = useAuth();
  const { activeSubProfile } = useSubProfile();
  const { setSelectedChat } = useChat();
  const { setActiveInbox } = useChatStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const authHeaders = useCallback(() => {
    const h: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (activeSubProfile?.identityHash) {
      h["X-Identity-Hash"] = activeSubProfile.identityHash;
    }
    return h;
  }, [token, activeSubProfile?.identityHash]);

  const fetchNotifications = useCallback(async () => {
    if (!token || !activeSubProfile?.identityHash) return;
    try {
      setLoading(true);
      const res = await axios.get(`${getBackendUrl()}/notifications`, {
        headers: authHeaders(),
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error("[NotificationInbox] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, activeSubProfile?.identityHash, authHeaders]);

  const markAllAsRead = useCallback(async () => {
    if (!token || !activeSubProfile?.identityHash) return;
    const readAt = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) =>
        n.status === "unread" ? { ...n, status: "read", readAt } : n
      )
    );
    window.dispatchEvent(new CustomEvent("friend:notifications:read-all"));
    try {
      await axios.post(
        `${getBackendUrl()}/notifications/mark-all-read`,
        {},
        { headers: authHeaders() }
      );
    } catch (err) {
      console.error("[NotificationInbox] mark-all-read error:", err);
    }
  }, [token, activeSubProfile?.identityHash, authHeaders]);

  useEffect(() => {
    if (!isOpen) return;
    fetchNotifications().finally(() => {
      markAllAsRead();
    });
  }, [isOpen, fetchNotifications, markAllAsRead]);

  
  useEffect(() => {
    const onNew = (e: any) => {
      const notif = e.detail;
      if (!notif?.notificationId) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.notificationId === notif.notificationId)) return prev;
        const readAt = isOpen ? new Date().toISOString() : undefined;
        return [
          {
            notificationId: notif.notificationId,
            type: notif.type || "friend_request",
            title: notif.title || "",
            status: isOpen ? "read" : "unread",
            relatedUserHash: notif.relatedUserHash || "",
            createdAt: new Date().toISOString(),
            readAt,
            actionData: notif.actionData,
          },
          ...prev,
        ];
      });
      if (isOpen) markAllAsRead();
    };

    const onRemoved = (e: any) => {
      const requestId = e.detail?.requestId;
      if (!requestId) return;
      setNotifications((prev) =>
        prev.filter((n) => n.actionData?.requestId !== requestId)
      );
    };

    window.addEventListener("friend:notification:new", onNew);
    window.addEventListener("friend:notification:removed", onRemoved);
    return () => {
      window.removeEventListener("friend:notification:new", onNew);
      window.removeEventListener("friend:notification:removed", onRemoved);
    };
  }, [isOpen, markAllAsRead]);

  const handleFriendAction = async (
    action: "accept" | "reject",
    requestId: string,
    notificationId: string
  ) => {
    try {
      setActioningId(notificationId);
      const endpoint = `${getBackendUrl()}/friends/request/${requestId}/${action}`;
      await axios.post(
        endpoint,
        action === "reject" ? { reason: null } : {},
        { headers: authHeaders() }
      );

      
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );

      if (action === "accept") {
        const friendHash =
          notifications.find((n) => n.notificationId === notificationId)
            ?.actionData?.senderHash ||
          notifications.find((n) => n.notificationId === notificationId)
            ?.relatedUserHash;
        window.dispatchEvent(
          new CustomEvent("friend:connected", {
            detail: { friendHash },
          })
        );
      }

      toast.success(
        action === "accept"
          ? "Friend request accepted!"
          : "Friend request rejected"
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || `Failed to ${action} request`;
      toast.error(msg);
      console.error(`[NotificationInbox] ${action} error:`, err);
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await axios.delete(
        `${getBackendUrl()}/notifications/${notificationId}`,
        { headers: authHeaders() }
      );
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );
    } catch (err) {
      
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await axios.post(
        `${getBackendUrl()}/notifications/${notificationId}/mark-read`,
        {},
        { headers: authHeaders() }
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, status: "read" } : n
        )
      );
    } catch (err) {
      console.error("[NotificationInbox] mark-read error:", err);
    }
  };

  
  const openChatWithFriend = (friendHash: string, notificationId: string) => {
    if (!friendHash) return;
    setSelectedChat({ type: "dm", otherHash: friendHash.toLowerCase() });
    setActiveInbox(true);
    handleMarkAsRead(notificationId);
    onClose();
  };

  
  const getDisplayInfo = (n: Notification) => {
    const ad = n.actionData || {};
    if (n.type === "friend_request") {
      return {
        name: ad.senderName || "Unknown User",
        avatarUrl: ad.senderAvatar,
        avatarId: ad.senderAvatarId,
        hash: ad.senderHash || n.relatedUserHash,
      };
    }
    if (n.type === "friend_accepted") {
      return {
        name: ad.receiverName || ad.senderName || "Unknown User",
        avatarUrl: ad.receiverAvatar || ad.senderAvatar,
        avatarId: ad.receiverAvatarId ?? ad.senderAvatarId,
        hash: ad.friendHash || n.relatedUserHash,
      };
    }
    return {
      name: ad.senderName || "User",
      avatarUrl: ad.senderAvatar,
      avatarId: ad.senderAvatarId,
      hash: n.relatedUserHash,
    };
  };

  const renderTitle = (n: Notification, name: string): string => {
    switch (n.type) {
      case "friend_request":
        return `${name} sent you a friend request`;
      case "friend_accepted":
        return `${name} accepted your friend request`;
      case "friend_request_cancelled":
        return n.title || `${name} cancelled their friend request`;
      default:
        return n.title;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border-l border-white/10 shadow-2xl flex flex-col animate-slide-in-right"
      >
        {}
        <div className="sticky top-0 z-10 bg-white/5 backdrop-blur-md border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#3730EA]/20 border border-[#3730EA]/40 flex items-center justify-center">
              <FiBell className="text-[#9DA3FF]" size={16} />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">
                Notifications
              </h2>
              <p className="text-white/50 text-xs">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition flex items-center justify-center"
          >
            <FiX size={18} />
          </button>
        </div>

        {}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-5 py-6 space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FiBell className="text-white/40" size={28} />
              </div>
              <p className="text-white font-medium">No notifications yet</p>
              <p className="text-white/50 text-sm mt-1">
                Friend requests and updates will appear here
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {notifications.map((n) => {
                const info = getDisplayInfo(n);
                const isUnread = n.status === "unread";
                const isFriendRequest = n.type === "friend_request";
                const isFriendAccepted = n.type === "friend_accepted";
                const requestId =
                  n.actionData?.requestId || n.notificationId;
                const isActioning = actioningId === n.notificationId;

                return (
                  <li
                    key={n.notificationId}
                    className={`group relative px-5 py-4 transition ${
                      isUnread ? "bg-white/[0.03]" : ""
                    } ${
                      isFriendAccepted ? "cursor-pointer hover:bg-white/[0.06]" : ""
                    }`}
                    onClick={
                      isFriendAccepted && info.hash
                        ? () => openChatWithFriend(info.hash, n.notificationId)
                        : undefined
                    }
                  >
                    {}
                    {isUnread && (
                      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-[#3730EA]" />
                    )}

                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <Avatar
                          url={info.avatarUrl}
                          avatarId={info.avatarId}
                          name={info.name}
                          hash={info.hash}
                          size={44}
                        />
                        {}
                        <div
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#16213e] ${
                            isFriendRequest
                              ? "bg-[#3730EA]"
                              : isFriendAccepted
                                ? "bg-green-500"
                                : "bg-white/30"
                          }`}
                        >
                          {isFriendRequest ? (
                            <FiUserPlus className="text-white" size={10} />
                          ) : isFriendAccepted ? (
                            <FiCheck className="text-white" size={10} />
                          ) : null}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm leading-snug">
                          <span className="font-semibold">{info.name}</span>
                          <span className="text-white/80">
                            {n.type === "friend_request"
                              ? " sent you a friend request"
                              : n.type === "friend_accepted"
                                ? " accepted your friend request"
                                : ` ${n.title.replace(info.name, "").trim()}`}
                          </span>
                        </p>
                        <p className="text-white/40 text-[11px] mt-1">
                          {formatRelativeTime(n.createdAt)}
                        </p>

                        {}
                        {isFriendRequest && (
                          <div className="mt-3 flex gap-2">
                            <button
                              disabled={isActioning}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFriendAction(
                                  "accept",
                                  requestId,
                                  n.notificationId
                                );
                              }}
                              className="flex-1 py-2 px-3 rounded-lg bg-[#3730EA] hover:bg-[#4B45F0] active:scale-[0.97] text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <FiCheck size={13} />
                              Accept
                            </button>
                            <button
                              disabled={isActioning}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFriendAction(
                                  "reject",
                                  requestId,
                                  n.notificationId
                                );
                              }}
                              className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white active:scale-[0.97] text-xs font-semibold transition disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {}
                        {isFriendAccepted && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#9DA3FF] opacity-0 group-hover:opacity-100 transition">
                            <FiMessageCircle size={11} />
                            Click to start chatting
                          </div>
                        )}
                      </div>

                      {}
                      {!isFriendRequest && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n.notificationId);
                          }}
                          aria-label="Dismiss"
                          className="self-start opacity-0 group-hover:opacity-100 transition w-7 h-7 rounded-full hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center"
                        >
                          <FiX size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        :global(.animate-fade-in) {
          animation: fade-in 0.18s ease-out;
        }
        :global(.animate-slide-in-right) {
          animation: slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
