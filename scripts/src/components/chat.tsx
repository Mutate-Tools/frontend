"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import axios from "axios";
import chatBg from "@assets/chatbg.svg";
import { FiSmile, FiSend, FiPaperclip, FiInfo } from "react-icons/fi";
import { format, isToday, isYesterday } from "date-fns";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import toast from "react-hot-toast";

import env from "../constants/environment";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import { useSubProfile } from "../contexts/SubProfileContext";
import { useChatStore } from "../state/chat-store";
import AttachmentPreview from "./attachmentPreview";
import type { LocalMessage, SystemPayload } from "../utils/crypto/storage-util";
import MessageRow, { RenderedChatMessage } from "./chat/messageRow";
import {
  avatarForUser,
  displayNameForUser,
  mergeUsersWithDeletedMarkers,
  shouldUseDeletedAvatar,
} from "../utils/deleted-user-util";
import FriendStatusButton from "./friendStatusButton";
import ChatInfoView from "./chatInfoView";
import { getBackendUrl } from '@/src/utils/backend-url';

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface UserLite {
  emailHash: string;
  username: string | null;
  avatarId?: number;
  avatarUrl?: string | null;
  deleted?: boolean;
}


const formatMessageTime = (ts: number): string => {
  const d = new Date(ts);
  if (isToday(d)) return `Today ${format(d, "h:mm a").toLowerCase()}`;
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a").toLowerCase()}`;
  return format(d, "MMM d, yyyy h:mm a");
};

const isPendingDirectMessage = (msg: LocalMessage) => msg._id.includes(":pending-");

const isSamePendingDirectMessage = (pending: LocalMessage, confirmed: LocalMessage) => {
  const closeInTime = Math.abs(pending.timestamp - confirmed.timestamp) < 120_000;
  return (
    closeInTime &&
    pending.senderEmailHash.toLowerCase() === confirmed.senderEmailHash.toLowerCase() &&
    pending.recipientEmailHash.toLowerCase() === confirmed.recipientEmailHash.toLowerCase() &&
    pending.chatId.toLowerCase() === confirmed.chatId.toLowerCase() &&
    pending.message === confirmed.message
  );
};

const collapsePendingDirectEchoes = (items: LocalMessage[], myHash: string) => {
  if (!myHash) return items;
  const next: LocalMessage[] = [];
  for (const msg of items) {
    const isMine = msg.senderEmailHash.toLowerCase() === myHash;
    if (isMine && !isPendingDirectMessage(msg)) {
      const pendingIndex = next.findIndex(
        (item) =>
          item.senderEmailHash.toLowerCase() === myHash &&
          isPendingDirectMessage(item) &&
          isSamePendingDirectMessage(item, msg)
      );
      if (pendingIndex !== -1) {
        next[pendingIndex] = msg;
        continue;
      }
    }
    next.push(msg);
  }
  return next.length === items.length && next.every((item, index) => item === items[index])
    ? items
    : next;
};

const isPendingGroupMessage = (msg: { _id: string }) => msg._id.startsWith("local-group-pending-");

const isSamePendingGroupMessage = (pending: any, confirmed: any) => {
  const closeInTime = Math.abs(pending.timestamp - confirmed.timestamp) < 120_000;
  return (
    closeInTime &&
    pending.senderEmailHash?.toLowerCase() === confirmed.senderEmailHash?.toLowerCase() &&
    pending.groupId === confirmed.groupId &&
    pending.message === confirmed.message
  );
};

const collapsePendingGroupEchoes = (items: any[], myHash: string) => {
  if (!myHash) return items;
  const next: any[] = [];
  for (const msg of items) {
    const isMine = msg.senderEmailHash?.toLowerCase() === myHash;
    if (isMine && !isPendingGroupMessage(msg)) {
      const pendingIndex = next.findIndex(
        (item) =>
          item.senderEmailHash?.toLowerCase() === myHash &&
          isPendingGroupMessage(item) &&
          isSamePendingGroupMessage(item, msg)
      );
      if (pendingIndex !== -1) {
        next[pendingIndex] = msg;
        continue;
      }
    }
    next.push(msg);
  }
  return next.length === items.length && next.every((item, index) => item === items[index])
    ? items
    : next;
};

const Chat: React.FC = () => {
  const { token, profile } = useAuth();
  const { activeSubProfile } = useSubProfile();
  const {
    currentIdentityHash,
    selectedChat,
    setSelectedChat,
    messages,
    groupMessages,
    groups,
    sendDirectMessage,
    sendGroupMessage,
    joinGroupByShareToken,
    sendAttachment,
    startTyping,
    stopTyping,
    markDirectRead,
    markGroupRead,
    markGroupOpened,
    refreshReadState,
    dmReadState,
    groupReads,
    typingPeers,
    loadOlderMessages,
    hasMoreMessages,
    isLoadingOlderMessages,
    isLoadingChatMessages,
  } = useChat();
  const { setActiveInbox } = useChatStore();

  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, UserLite>>({});
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const isPrependingOlderRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myHash = (currentIdentityHash || "").toLowerCase();


  const selectedChatKey = selectedChat
    ? selectedChat.type === "dm"
      ? `dm:${selectedChat.otherHash}`
      : `group:${selectedChat.groupId}`
    : "";
  const prevChatKeyRef = useRef<string>("");


  const initialScrollDoneRef = useRef<boolean>(false);

  const activeGroup = useMemo(
    () =>
      selectedChat?.type === "group"
        ? groups.find((g) => g._id === selectedChat.groupId)
        : undefined,
    [selectedChat, groups],
  );
  const isActiveGroupMember =
    selectedChat?.type !== "group" ||
    !!activeGroup?.members?.some((m) => m.emailHash.toLowerCase() === myHash);

  useEffect(() => {
    setShowInfo(false);
  }, [selectedChatKey]);

  useEffect(() => {
    const handleUserPreview = (event: Event) => {
      const detail = (event as CustomEvent<UserLite>).detail;
      const hash = detail?.emailHash?.toLowerCase();
      if (!hash) return;
      setUserMap((prev) => ({
        ...prev,
        [hash]: {
          ...detail,
          emailHash: hash,
        },
      }));
    };
    window.addEventListener("chat:user-preview", handleUserPreview);
    return () => window.removeEventListener("chat:user-preview", handleUserPreview);
  }, []);

  useEffect(() => {
    if (selectedChat?.type !== "dm") return;
    const hash = selectedChat.otherHash.toLowerCase();
    if (userMap[hash]) return;
    try {
      const raw = sessionStorage.getItem(`mutate_chat_user_preview:${hash}`);
      if (!raw) return;
      const preview = JSON.parse(raw) as UserLite;
      setUserMap((prev) => ({
        ...prev,
        [hash]: {
          ...preview,
          emailHash: hash,
        },
      }));
    } catch {}
  }, [selectedChat, userMap]);


  const hashesToResolve = useMemo(() => {
    const s = new Set<string>();
    const addHash = (hash?: string) => {
      const normalized = hash?.toLowerCase();
      if (normalized) s.add(normalized);
    };
    if (selectedChat?.type === "dm") addHash(selectedChat.otherHash);
    if (selectedChat?.type === "group" && activeGroup) {
      for (const m of activeGroup.members) addHash(m.emailHash);
      for (const m of groupMessages) {
        addHash(m.senderEmailHash);
        const payload = (m as any).systemPayload as SystemPayload | undefined;
        addHash(payload?.actorEmailHash);
        addHash(payload?.targetEmailHash);
      }
    }
    for (const m of messages) {
      addHash(m.senderEmailHash);
      addHash(m.recipientEmailHash);
    }
    s.delete(myHash);
    return Array.from(s).filter((h) => h && !userMap[h]);
  }, [selectedChat, activeGroup, groupMessages, messages, userMap, myHash]);

  
  
  useEffect(() => {
    if (!token || !currentIdentityHash || hashesToResolve.length === 0) return;
    const timer = setTimeout(() => {
      axios
        .post(
          `${getBackendUrl()}/users/by-hashes`,
          { emailHashes: hashesToResolve },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Identity-Hash": currentIdentityHash.toLowerCase(),
            },
          },
        )
        .then((res) => {
          setUserMap((prev) =>
            mergeUsersWithDeletedMarkers(prev, hashesToResolve, res.data.users || [])
          );
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [hashesToResolve, token, currentIdentityHash]);








  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    
    
    if (isPrependingOlderRef.current) {
      const heightDiff = container.scrollHeight - prevScrollHeightRef.current;
      if (heightDiff > 0) container.scrollTop += heightDiff;
      isPrependingOlderRef.current = false;
      return;
    }

    const chatChanged = prevChatKeyRef.current !== selectedChatKey;
    if (chatChanged) {
      prevChatKeyRef.current = selectedChatKey;
      initialScrollDoneRef.current = false;
    }

    const listLength =
      selectedChat?.type === "dm" ? messages.length : groupMessages.length;

    if (!initialScrollDoneRef.current) {
      container.scrollTop = container.scrollHeight;
      if (listLength > 0) initialScrollDoneRef.current = true;
      return;
    }

    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, groupMessages, selectedChatKey, selectedChat?.type]);


  
  
  
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingOlderMessages || !hasMoreMessages || isPrependingOlderRef.current) return;
    if (container.scrollTop < 150) {
      isPrependingOlderRef.current = true;
      prevScrollHeightRef.current = container.scrollHeight;
      loadOlderMessages().catch(() => {
        isPrependingOlderRef.current = false;
      });
    }
  }, [loadOlderMessages, hasMoreMessages, isLoadingOlderMessages]);

  useEffect(() => {
    refreshReadState().catch(() => {});
  }, [refreshReadState]);


  useEffect(() => {
    if (!selectedChat) return;
    if (selectedChat.type === "dm") {
      const latestPeer = messages
        .filter((m) => m.senderEmailHash.toLowerCase() !== myHash)
        .reduce((acc, m) => Math.max(acc, m.timestamp), 0);
      if (latestPeer > 0) {
        markDirectRead(selectedChat.otherHash, latestPeer).catch(() => {});
      }
    } else {
      if (!isActiveGroupMember) return;
      
      
      
      markGroupOpened(selectedChat.groupId).catch(() => {});
      const unreadIds = groupMessages
        .filter((m) => (m as any).messageType !== "system")
        .filter((m) => m.senderEmailHash.toLowerCase() !== myHash)
        .filter((m) => {
          const readers = groupReads[m._id] || [];
          return !readers.some((r) => r.emailHash === myHash);
        })
        .map((m) => m._id);
      if (unreadIds.length > 0) {
        markGroupRead(selectedChat.groupId, unreadIds).catch(() => {});
      }
    }
  }, [
    selectedChat,
    messages,
    groupMessages,
    myHash,
    markDirectRead,
    markGroupRead,
    markGroupOpened,
    groupReads,
    isActiveGroupMember,
  ]);

  const displayName = (() => {
    if (selectedChat?.type === "group") return activeGroup?.name || "Group";
    if (selectedChat?.type === "dm") {
      const peerHash = selectedChat.otherHash.toLowerCase();
      const u = userMap[peerHash];
      return displayNameForUser(u, peerHash);
    }
    return "";
  })();

  const headerAvatar = (() => {
    if (selectedChat?.type === "group")
      return (
        env.GROUP_AVATARS?.[activeGroup?.avatarId ?? 0] ||
        env.GROUP_AVATARS?.[0]
      );
    if (selectedChat?.type === "dm") {
      const peerHash = selectedChat.otherHash.toLowerCase();
      const u = userMap[peerHash];
      return avatarForUser(
        u,
        peerHash,
        env.GROUP_AVATARS?.[u?.avatarId ?? 0] || env.GROUP_AVATARS?.[0]
      );
    }
    return env.GROUP_AVATARS?.[0];
  })();

  const headerAvatarUnoptimized =
    selectedChat?.type === "dm"
      ? !!userMap[selectedChat.otherHash.toLowerCase()]?.avatarUrl ||
        shouldUseDeletedAvatar(
          userMap[selectedChat.otherHash.toLowerCase()],
          selectedChat.otherHash.toLowerCase()
        )
      : false;

  const typingLabel = (() => {
    if (!selectedChat) return "";
    const key =
      selectedChat.type === "dm"
        ? (`dm:${selectedChat.otherHash}` as const)
        : (`group:${selectedChat.groupId}` as const);
    const hashes = typingPeers[key] || [];
    if (hashes.length === 0) return "";
    const names = hashes
      .map((h) => displayNameForUser(userMap[h], h, 6))
      .slice(0, 2);
    if (hashes.length === 1) return `${names[0]} is typing…`;
    if (hashes.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return `${names[0]} and ${hashes.length - 1} others are typing…`;
  })();

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !selectedChat) return;
    if (selectedChat.type === "group" && !isActiveGroupMember) {
      toast.error("Join this group before sending messages.");
      return;
    }
    setText("");
    setShowEmojiPicker(false);
    try {
      stopTyping(
        selectedChat.type === "dm"
          ? { type: "dm", chatId: selectedChat.otherHash }
          : { type: "group", chatId: selectedChat.groupId },
      );
      if (selectedChat.type === "dm") {
        await sendDirectMessage(selectedChat.otherHash, content);
      } else {
        await sendGroupMessage(selectedChat.groupId, content);
      }
    } catch (e: any) {
      console.error("[Chat] send failed", e.message);
      setText((current) => current || content);
      toast.error(e?.message || "Failed to send message");
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!selectedChat) return;
    if (selectedChat.type === "group" && !isActiveGroupMember) return;
    if (!e.target.value.trim()) {
      stopTyping(
        selectedChat.type === "dm"
          ? { type: "dm", chatId: selectedChat.otherHash }
          : { type: "group", chatId: selectedChat.groupId },
      );
      return;
    }
    startTyping(
      selectedChat.type === "dm"
        ? { type: "dm", chatId: selectedChat.otherHash }
        : { type: "group", chatId: selectedChat.groupId },
    );
  };

  const handleAttachClick = () => {
    if (selectedChat?.type === "group" && !isActiveGroupMember) {
      toast.error("Join this group before sending files.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedChat) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File too large (max 25 MB)");
      return;
    }
    setPendingFile(file);
  };

  const handlePreviewSend = async (caption: string) => {
    if (!pendingFile || !selectedChat) return;
    try {
      setUploading(true);
      const target =
        selectedChat.type === "dm"
          ? ({ type: "dm", otherHash: selectedChat.otherHash } as const)
          : ({ type: "group", groupId: selectedChat.groupId } as const);
      await sendAttachment(target, pendingFile, caption || undefined);
      setPendingFile(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewCancel = () => {
    if (uploading) return;
    setPendingFile(null);
  };

  const onEmojiClick = (emojiObject: any) => {
    setText((prev) => prev + emojiObject.emoji);
  };

  const handleJoinPublicGroup = async () => {
    if (!activeGroup?.shareToken) {
      toast.error("This group cannot be joined from here.");
      return;
    }
    try {
      const result = await joinGroupByShareToken(activeGroup.shareToken);
      if (result.status === "joined" || result.status === "already-member") {
        toast.success("Joined group");
      } else {
        toast.success("Request sent to admins");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message || "Failed to join group");
    }
  };

  const peerReadAt =
    selectedChat?.type === "dm"
      ? (dmReadState.theirs[selectedChat.otherHash] ?? 0)
      : 0;

  const renderedMessages = useMemo<RenderedChatMessage[]>(() => {
    const source =
      selectedChat?.type === "dm"
        ? collapsePendingDirectEchoes(messages, myHash)
        : collapsePendingGroupEchoes(groupMessages, myHash);
    const myAvatar =
      activeSubProfile?.avatarUrl ||
      env.GROUP_AVATARS?.[activeSubProfile?.avatarId ?? profile?.avatarId ?? 0] ||
      env.GROUP_AVATARS?.[0];
    const resolveName = (hash?: string) => {
      if (!hash) return "Someone";
      const h = hash.toLowerCase();
      if (h === myHash) return "You";
      return displayNameForUser(userMap[h], hash);
    };
    const formatSystemText = (payload: SystemPayload): string | null => {
      const actor = resolveName(payload.actorEmailHash);
      const target = resolveName(payload.targetEmailHash);
      switch (payload.kind) {
        case "group_created":
          return `${actor} created the group`;
        case "member_joined":
          return payload.actorEmailHash?.toLowerCase() === payload.targetEmailHash?.toLowerCase()
            ? `${target} joined the group`
            : `${actor} approved ${target} to join`;
        case "member_added":
          return `${actor} added ${target}`;
        case "member_left":
          return `${target} left the group`;
        case "member_removed":
          if (
            payload.actorEmailHash &&
            payload.targetEmailHash &&
            payload.actorEmailHash.toLowerCase() === payload.targetEmailHash.toLowerCase()
          ) {
            return null;
          }
          return `${actor} removed ${target}`;
        case "group_updated": {
          const changes = payload.changes || {};
          const keys = Object.keys(changes);
          if (keys.length === 0) return `${actor} updated the group`;
          const parts = keys.map((k) => {
            const v = (changes as any)[k];
            if (k === "name") return `renamed the group to "${v?.to}"`;
            if (k === "description") return "updated the description";
            if (k === "avatarId") return "changed the avatar";
            if (k === "isPublic") return v?.to ? "made the group public" : "made the group private";
            return `updated ${k}`;
          });
          return `${actor} ${parts.join(", ")}`;
        }
        case "admin_promoted":
          return payload.actorEmailHash?.toLowerCase() === payload.targetEmailHash?.toLowerCase()
            ? `${target} became an admin`
            : `${actor} made ${target} an admin`;
        case "admin_demoted":
          return `${actor} removed ${target} from admins`;
        default:
          return `${actor} updated the group`;
      }
    };

    const map = new Map<string, RenderedChatMessage>();
    for (const m of source) {
      const senderHash = m.senderEmailHash.toLowerCase();
      const isMine = senderHash === myHash;
      const messageType = (m as any).messageType as "text" | "file" | "system" | undefined;
      const systemPayload = (m as any).systemPayload as SystemPayload | undefined;
      const formattedSystemText =
        messageType === "system" && systemPayload ? formatSystemText(systemPayload) : null;
      const systemText = formattedSystemText || undefined;
      if (messageType === "system" && !systemText) continue;
      const senderUser = userMap[senderHash];
      const readers = selectedChat?.type === "group" && isMine
        ? (groupReads[m._id] || []).filter((r) => r.emailHash !== myHash)
        : [];
      const totalGroupReaders = Math.max(0, (activeGroup?.members?.length || 1) - 1);
      map.set(m._id, {
        _id: m._id,
        isMine,
        message: m.message,
        timestampLabel: formatMessageTime(m.timestamp),
        senderLabel: isMine
          ? activeSubProfile?.name || profile?.username || "You"
          : displayNameForUser(senderUser, m.senderEmailHash),
        senderAvatar: avatarForUser(
          senderUser,
          m.senderEmailHash,
          env.GROUP_AVATARS?.[senderUser?.avatarId ?? 0] || env.GROUP_AVATARS?.[0]
        ),
        senderAvatarUnoptimized:
          !!senderUser?.avatarUrl || shouldUseDeletedAvatar(senderUser, m.senderEmailHash),
        myAvatar,
        myAvatarUnoptimized: !!activeSubProfile?.avatarUrl,
        messageType,
        systemText,
        showDmTick: selectedChat?.type === "dm" && isMine,
        dmSeen: peerReadAt >= m.timestamp,
        groupReadText: readers.length > 0 ? `Seen by ${readers.length}/${totalGroupReaders}` : null,
        groupReadTitle: readers.map((r) => r.emailHash).join(", "),
      });
    }
    return Array.from(map.values());
  }, [
    selectedChat?.type,
    messages,
    groupMessages,
    myHash,
    userMap,
    activeSubProfile,
    profile,
    peerReadAt,
    groupReads,
    activeGroup,
  ]);

  const closeChat = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches &&
      window.history.state?.__mutateChatOverlay
    ) {
      window.history.back();
      return;
    }
    setActiveInbox(false);
    setSelectedChat(null);
  };

  return (
    <div className="w-full fixed inset-0 z-[9998] h-[100dvh] overflow-hidden bg-[#08080D] lg:relative lg:inset-auto lg:z-auto lg:rounded-[30px] 2xl:h-[650px] lg:h-[600px] lg:p-[20px] lg:border-[1px] lg:border-white/20 lg:bg-[#FFFFFF1A]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${chatBg.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-5" />

      {!showInfo && (
        <div className="fixed top-0 left-0 z-20 w-full max-w-none lg:absolute lg:top-3 xl:top-4 lg:left-[46%] xl:left-[48%] 2xl:left-1/2 lg:-translate-x-1/2 lg:w-[90%] lg:max-w-[671px]">
          <div className="flex items-center gap-2 sm:gap-3 bg-black/35 backdrop-blur-md border-b border-white/10 px-4 py-3 shadow-lg z-20 lg:bg-white/10 lg:rounded-full lg:px-4 lg:py-3 lg:border lg:border-white/10">
            <div className="lg:hidden">
              <button
                onClick={closeChat}
                className="flex h-9 w-9 items-center justify-center rounded-full active:bg-white/10"
                aria-label="Back to inbox"
              >
                <MdOutlineKeyboardBackspace className="text-[24px]" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 text-left"
              aria-label="Open chat info"
            >
              <Image
                key={`header-avatar-${selectedChatKey}-${String(headerAvatar)}`}
                src={headerAvatar}
                alt="profile"
                width={48}
                height={48}
                unoptimized={headerAvatarUnoptimized}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex gap-[10px] items-center">
                  <h2 className="text-white font-semibold truncate text-[12px] lg:text-sm xl:text-base">
                    {displayName}
                  </h2>
                  {selectedChat?.type === "group" && (
                    <span className="bg-[#3730EA] px-[10px] py-[2px] rounded-full text-white flex items-center justify-center text-[8px] xl:text-[10px]">
                      {activeGroup?.isPublic ? "Public" : "Private"}
                    </span>
                  )}
                </div>
                {typingLabel ? (
                  <span className="text-[#A19DFF] text-[11px] lg:text-[11px] xl:text-[12px] italic">
                    {typingLabel}
                  </span>
                ) : (
                  selectedChat?.type === "group" && (
                    <span className="text-white/50 text-[12px] lg:text-xs xl:text-sm">
                      {activeGroup?.members?.length || 0} Members
                    </span>
                  )
                )}
              </div>
            </button>
            {selectedChat?.type === "dm" && (
              <div className="hidden sm:block">
                <FriendStatusButton otherHash={selectedChat.otherHash} />
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Open chat info"
            >
              <FiInfo size={18} />
            </button>
          </div>
        </div>
      )}

      {showInfo && selectedChat ? (
        <ChatInfoView chat={selectedChat} onBack={() => setShowInfo(false)} />
      ) : (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative z-10 h-[100dvh] overflow-y-auto flex flex-col gap-5 px-4 pt-[92px] pb-[112px] custom-scroll sm:pt-[96px] sm:pb-[126px] md:px-6 lg:h-full lg:pt-[85px] lg:pb-[110px] xl:pb-[130px]"
          style={{ scrollPaddingBottom: "130px" }}
        >
          {}
          {isLoadingOlderMessages && (
            <div className="flex items-center justify-center py-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            </div>
          )}
          {isLoadingChatMessages ? (
            
            <div className="flex flex-col gap-4 px-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
                  <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
                  <div className={`flex flex-col gap-2 ${i % 2 === 1 ? "items-end" : ""} max-w-[70%]`}>
                    <div className={`h-4 w-24 bg-white/10 animate-pulse rounded ${i % 2 === 1 ? "ml-auto" : ""}`} />
                    <div className={`h-16 bg-white/10 animate-pulse rounded-2xl ${i % 2 === 1 ? "rounded-tr-sm" : "rounded-tl-sm"} w-full min-w-[200px]`} />
                  </div>
                </div>
              ))}
            </div>
          ) : selectedChat?.type === "group" && activeGroup && !isActiveGroupMember ? (
            <div className="flex min-h-full items-center justify-center px-4">
              <div className="w-full max-w-[360px] rounded-[22px] border border-white/10 bg-black/35 p-5 text-center backdrop-blur-md">
                <Image
                  key={`join-avatar-${selectedChatKey}-${String(headerAvatar)}`}
                  src={headerAvatar}
                  alt={activeGroup.name}
                  width={72}
                  height={72}
                  className="mx-auto h-[72px] w-[72px] rounded-full object-cover"
                />
                <h3 className="mt-4 text-lg font-semibold text-white">{activeGroup.name}</h3>
                <p className="mt-2 text-sm text-white/60">
                  Join this public group to view and send messages.
                </p>
                <button
                  onClick={handleJoinPublicGroup}
                  className="mt-5 h-11 w-full rounded-full bg-[#3730EA] text-sm font-medium text-white transition hover:bg-[#4338CA]"
                  style={{
                    boxShadow:
                      "inset 0 0 2px #FFFFFF, inset 0 0 6px #A19DFF, inset 0 2px 10px #3730EA",
                  }}
                >
                  Join Group
                </button>
              </div>
            </div>
          ) : renderedMessages.map((msg) => <MessageRow key={msg._id} msg={msg} />)}
          <div ref={chatEndRef} />
        </div>
      )}

      {!showInfo && (
      <div className="fixed bottom-0 left-0 z-20 w-full px-3 pt-3 pb-3 bg-black/20 backdrop-blur-md footer-input-area lg:absolute lg:bottom-4 lg:left-[30%] xl:left-1/2 lg:-translate-x-1/2 lg:w-[90%] lg:max-w-[150px] xl:max-w-[671px] lg:bg-transparent lg:backdrop-blur-none lg:p-0">
        <div className="flex items-center xl:gap-2 gap-1 lg:gap-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelected}
          />
          <button
            onClick={handleAttachClick}
            disabled={uploading || !selectedChat || (selectedChat.type === "group" && !isActiveGroupMember)}
            className="bg-white/10 p-2 sm:p-3 rounded-full flex-shrink-0 hover:bg-white/20 disabled:opacity-50 transition"
            title="Attach file"
          >
            <FiPaperclip className="text-white text-[18px] lg:text-[12px] xl:text-lg" />
          </button>
          <div className="flex items-center flex-1 min-w-0 xl:gap-2 lg:gap-3 bg-white/10 backdrop-blur-md rounded-full px-3 sm:px-4 py-2 sm:py-4 border border-white/10 shadow-lg z-20 lg:w-[160px] xl:w-auto">
            <input
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                selectedChat?.type === "group" && !isActiveGroupMember
                  ? "Join group to chat"
                  : uploading
                    ? "Uploading…"
                    : "Write message..."
              }
              disabled={uploading || (selectedChat?.type === "group" && !isActiveGroupMember)}
              
              
              
              
              
              
              
              className="flex-1 bg-transparent max-lg:h-[30px] outline-none text-[#EAF0FF] placeholder:text-white/50 text-[16px] xl:text-sm min-w-0"
            />
            <button onClick={() => setShowEmojiPicker((prev) => !prev)}>
              <FiSmile className="text-white/70 hover:text-white text-[20px] lg:text-[12px] xl:text-xl cursor-pointer flex-shrink-0 transition-colors duration-200" />
            </button>
          </div>
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 right-0 z-30">
              <div className="mx-auto max-w-md">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  theme={"dark" as any}
                  height={350}
                  width="100%"
                  previewConfig={{ showPreview: false }}
                  searchPlaceholder="Search emoji..."
                />
              </div>
            </div>
          )}
          <button
            onClick={handleSend}
            disabled={selectedChat?.type === "group" && !isActiveGroupMember}
            className="bg-[#3730EA] p-2 sm:p-3 rounded-full flex-shrink-0 transition-all duration-200 hover:bg-[#4338CA] shadow-lg hover:shadow-xl z-20"
            style={{
              boxShadow: `
      inset 0 0 2px #FFFFFF,
      inset 0 0 6px #A19DFF,
      inset 0 2px 10px #3730EA
    `,
            }}
          >
            <FiSend className="text-white text-[20px] lg:text-[12px] xl:text-xl" />
          </button>
        </div>
      </div>
      )}

      {pendingFile && (
        <AttachmentPreview
          file={pendingFile}
          uploading={uploading}
          onSend={handlePreviewSend}
          onCancel={handlePreviewCancel}
        />
      )}

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #4f46e5;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #4338ca;
        }
        @media (min-width: 768px) {
          .custom-scroll::-webkit-scrollbar {
            width: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
