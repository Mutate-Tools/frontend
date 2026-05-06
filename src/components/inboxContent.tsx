"use client";

import { useEffect, useMemo, useState, type UIEvent } from "react";
import { IoSearchOutline } from "react-icons/io5";
import Image from "next/image";
import cardbg from "@assets/dapp/cardbg.svg";
import axios from "axios";
import { format, isToday, isYesterday } from "date-fns";
import env from "../constants/environment";
import { useAuth } from "@/src/contexts/AuthContext";
import { useChat } from "@/src/contexts/ChatContext";
import { useChatStore } from "@/src/state/chat-store";
import { storageUtil } from "@/src/utils/crypto/storage-util";
import { getBackendUrl } from '@/src/utils/backend-url';
import Avatar from "./avatar";

type TabType = "all" | "chats" | "groups";

interface UserLite {
  emailHash: string;
  username: string | null;
  avatarId?: number;
  avatarUrl?: string | null;
}

const previewKey = (hash: string) => `mutate_chat_user_preview:${hash.toLowerCase()}`;

const readCachedUserPreview = (hash: string): UserLite | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(previewKey(hash));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const emailHash = String(parsed?.emailHash || hash).toLowerCase();
    const username = typeof parsed?.username === "string" ? parsed.username : null;
    if (!emailHash || !username) return null;
    return {
      emailHash,
      username,
      avatarId: typeof parsed?.avatarId === "number" ? parsed.avatarId : 0,
      avatarUrl: typeof parsed?.avatarUrl === "string" ? parsed.avatarUrl : null,
    };
  } catch {
    return null;
  }
};

const cacheUserPreview = (user: UserLite) => {
  if (typeof window === "undefined" || !user.emailHash || !user.username) return;
  try {
    window.sessionStorage.setItem(previewKey(user.emailHash), JSON.stringify(user));
  } catch {}
};


const formatTime = (ts?: number) => {
  if (!ts) return "";
  const d = new Date(ts);
  if (isToday(d)) return `Today ${format(d, "h:mm a").toLowerCase()}`;
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a").toLowerCase()}`;
  return format(d, "MMM d, h:mm a");
};

const formatLastMessage = (raw: string): string => {
  if (!raw) return "";
  if (raw[0] === "{") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.kind === "attachment") {
        const mime: string = parsed.mime || "";
        if (mime.startsWith("image/")) return "📷 Photo";
        if (mime.startsWith("video/")) return "🎬 Video";
        if (mime.startsWith("audio/")) return "🎵 Audio";
        if (mime === "application/pdf") return "📎 PDF";
        return `📎 ${parsed.name || "File"}`;
      }
    } catch {}
  }
  return raw;
};


const InboxContent = () => {
  const { token, emailHash: parentEmailHash } = useAuth();
  const {
    currentIdentityHash,
    dms,
    groups,
    selectedChat,
    setSelectedChat,
    refreshDMs,
    refreshGroups,
    loadMoreGroups,
    groupsHasMore,
    groupsLoading,
    dmsLoading,
    dmReadState,
    groupOpenedAt,
    markGroupOpened,
  } = useChat();
  const { setActiveInbox } = useChatStore();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userMap, setUserMap] = useState<Record<string, UserLite>>({});
  const [dmUnread, setDmUnread] = useState<Record<string, number>>({});
  const [groupUnread, setGroupUnread] = useState<Record<string, number>>({});
  const missingUserHashes = useMemo(
    () =>
      Array.from(
        new Set(
          dms
            .map((d) => d.otherHash.toLowerCase())
            .filter((h) => h && !userMap[h])
        )
      ),
    [dms, userMap]
  );

  useEffect(() => {
    if (!currentIdentityHash) return;
    refreshDMs();
    refreshGroups({ reset: true, limit: 10 });
  }, [currentIdentityHash, refreshDMs, refreshGroups]);

  useEffect(() => {
    if (dms.length === 0) return;
    setUserMap((prev) => {
      let changed = false;
      const next: Record<string, UserLite> = { ...prev };
      for (const dm of dms) {
        const hash = dm.otherHash.toLowerCase();
        if (next[hash]) continue;
        const cached = readCachedUserPreview(hash);
        if (cached) {
          next[hash] = cached;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [dms]);

  useEffect(() => {
    const onPreview = (event: Event) => {
      const detail = (event as CustomEvent<UserLite>).detail;
      const hash = String(detail?.emailHash || "").toLowerCase();
      const username = typeof detail?.username === "string" ? detail.username : null;
      if (!hash || !username) return;
      const user: UserLite = {
        emailHash: hash,
        username,
        avatarId: typeof detail?.avatarId === "number" ? detail.avatarId : 0,
        avatarUrl: typeof detail?.avatarUrl === "string" ? detail.avatarUrl : null,
      };
      cacheUserPreview(user);
      setUserMap((prev) => ({ ...prev, [hash]: user }));
    };
    window.addEventListener("chat:user-preview", onPreview);
    return () => window.removeEventListener("chat:user-preview", onPreview);
  }, []);


  
  
  useEffect(() => {
    if (missingUserHashes.length === 0 || !token || !currentIdentityHash) return;
    const timer = setTimeout(() => {
      axios
        .post(
          `${getBackendUrl()}/users/by-hashes`,
          { emailHashes: missingUserHashes },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Identity-Hash": currentIdentityHash.toLowerCase(),
            },
          }
        )
        .then((res) => {
          setUserMap((prev) => {
            const next: Record<string, UserLite> = { ...prev };
            const returned = new Set<string>();
            for (const raw of res.data.users || []) {
              const hash = String(raw.emailHash || "").toLowerCase();
              if (!hash) continue;
              const user: UserLite = {
                emailHash: hash,
                username: raw.username || null,
                avatarId: raw.avatarId ?? 0,
                avatarUrl: raw.avatarUrl ?? null,
              };
              next[hash] = user;
              returned.add(hash);
              cacheUserPreview(user);
            }
            for (const hash of missingUserHashes) {
              if (!returned.has(hash)) {
                next[hash] = { emailHash: hash, username: "Unknown user", avatarId: 0, avatarUrl: null };
              }
            }
            return next;
          });
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [missingUserHashes, token, currentIdentityHash]);

  
  
  
  
  const sameCountsMap = (
    a: Record<string, number>,
    b: Record<string, number>,
  ) => {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (a[k] !== b[k]) return false;
    return true;
  };

  const freshStartBoundary = useMemo(() => {
    if (typeof window === "undefined" || !parentEmailHash) return null;
    const parent = parentEmailHash.toLowerCase();
    const mode =
      localStorage.getItem(`parent_device_mode_${parent}`) ||
      localStorage.getItem(`device_setup_mode_${parent}`);
    const startedAt = Number(localStorage.getItem(`parent_fresh_started_at_${parent}`) || 0);
    return mode === "fresh_start" && Number.isFinite(startedAt) && startedAt > 0
      ? startedAt
      : null;
  }, [parentEmailHash]);

  function filterFreshVisible<T extends { timestamp: number }>(history: T[]): T[] {
    return freshStartBoundary
      ? history.filter((message) => message.timestamp >= freshStartBoundary)
      : history;
  }

  useEffect(() => {
    if (!currentIdentityHash) return;
    const me = currentIdentityHash.toLowerCase();
    let cancelled = false;
    
    
    const timer = setTimeout(async () => {
      const counts: Record<string, number> = {};
      await Promise.all(dms.map(async (d) => {
        try {
          const history = filterFreshVisible(await storageUtil.getChatHistory(me, d.otherHash));
          const lastRead = dmReadState.mine[d.otherHash] || 0;
          const count = history.filter(
            (m) => m.senderEmailHash.toLowerCase() === d.otherHash.toLowerCase() && m.timestamp > lastRead
          ).length;
          if (count > 0) counts[d.otherHash] = count;
        } catch {}
      }));
      if (!cancelled) {
        setDmUnread((prev) => (sameCountsMap(prev, counts) ? prev : counts));
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [dms, dmReadState, currentIdentityHash, freshStartBoundary]);

  useEffect(() => {
    if (!currentIdentityHash) return;
    const me = currentIdentityHash.toLowerCase();
    let cancelled = false;
    const timer = setTimeout(async () => {
      const counts: Record<string, number> = {};
      await Promise.all(groups.map(async (g) => {
        try {
          const history = filterFreshVisible(await storageUtil.getGroupHistory(me, g._id));
          if (history.length === 0) return;
          
          
          
          const opened = groupOpenedAt[g._id] || 0;
          const count = history.filter(
            (m) =>
              (m as any).messageType !== "system" &&
              m.senderEmailHash.toLowerCase() !== me &&
              m.timestamp > opened
          ).length;
          if (count > 0) counts[g._id] = count;
        } catch {}
      }));
      if (!cancelled) {
        setGroupUnread((prev) => (sameCountsMap(prev, counts) ? prev : counts));
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    
    
    
    
    
  }, [groups, currentIdentityHash, groupOpenedAt, freshStartBoundary]);

  const list = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const dmItems = dms.map((d) => {
      const hash = d.otherHash.toLowerCase();
      const u = userMap[hash];
      return {
        kind: "dm" as const,
        id: hash,
        name: u?.username || "Loading profile",
        avatarId: u?.avatarId ?? 0,
        avatarUrl: u?.avatarUrl ?? null,
        lastMessage: formatLastMessage(d.lastMessage?.message || ""),
        ts: d.lastMessage?.timestamp || 0,
      };
    });
    const memberGroups = groups.filter((g) =>
      g.members.some((m) => m.emailHash.toLowerCase() === (currentIdentityHash || "").toLowerCase())
    );
    const groupItems = memberGroups.map((g) => ({
      kind: "group" as const,
      id: g._id,
      name: g.name,
      avatarId: g.avatarId ?? 0,
      lastMessage: g.description || "",
      ts: g.updatedAt ? new Date(g.updatedAt).getTime() : 0,
      isPublic: !!g.isPublic,
      isMember: g.members.some((m) => m.emailHash.toLowerCase() === (currentIdentityHash || "").toLowerCase()),
    }));
    let merged: Array<typeof dmItems[number] | typeof groupItems[number]> = [];
    if (activeTab === "all") merged = [...dmItems, ...groupItems];
    else if (activeTab === "chats") merged = dmItems;
    else merged = groupItems;
    if (q) merged = merged.filter((item) => item.name.toLowerCase().includes(q));
    merged.sort((a, b) => b.ts - a.ts);
    return merged;
  }, [dms, groups, userMap, searchQuery, activeTab, currentIdentityHash]);

  const handleListScroll = (e: UIEvent<HTMLDivElement>) => {
    if (activeTab === "chats" || !groupsHasMore || groupsLoading) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      loadMoreGroups();
    }
  };

  return (
    <div className="lg:max-w-[345px] w-full pt-[30px]">
      <div className="flex items-center gap-[6px] p-[6px] h-[38px] rounded-[30px] w-full border border-[#EAF0FF1A]">
        <IoSearchOutline className="text-white text-[16px]" />
        <input
          type="text"
          placeholder="Search chats"
          className="bg-transparent outline-none text-[#EAF0FF] text-[12px] font-spaceGrotesk w-full placeholder:text-[#EAF0FF]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mt-4">
        {(["all", "chats", "groups"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-[70px] h-[28px] rounded-full text-[9px] font-spaceGrotesk font-medium flex items-center justify-center transition ${
              activeTab === tab
                ? "bg-[#3730EA] text-[#EAF0FF] shadow-[inset_0_0_10px_rgba(255,255,255,0.55),inset_0_2px_6px_rgba(255,255,255,0.35)]"
                : "border border-[#0E1422] text-[#EAF0FF]"
            }`}
          >
            {tab === "all" ? "All" : tab === "chats" ? "Chats" : "Groups"}
          </button>
        ))}
      </div>

      <div
        className="mt-[20px] md:h-[350px] h-[320px] lg:h-[350px] 2xl:h-[380px] overflow-y-auto xl:pr-2 inbox-scroll"
        onScroll={handleListScroll}
      >
        <div className="flex flex-col gap-[25px]">
          {}
          {(dmsLoading && dms.length === 0) || (groupsLoading && groups.length === 0 && activeTab !== "chats") ? (
            <div className="flex flex-col gap-[25px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="p-[13px] rounded-[20px] w-full border border-white/10 bg-white/5 animate-pulse h-[80px]"
                />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="text-sm text-white/60">No chats yet. Add a friend to start a conversation.</p>
          ) : (
            list.map((item) => {
              const isActive =
                item.kind === "dm"
                  ? selectedChat?.type === "dm" && selectedChat.otherHash === item.id
                  : selectedChat?.type === "group" && selectedChat.groupId === item.id;
              return (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="relative group p-[13px] rounded-[20px] w-full border cursor-pointer border-white/30 bg-[#FFFFFF1A] overflow-hidden"
                  onClick={() => {
                    setActiveInbox(true);
                    if (item.kind === "dm") {
                      setSelectedChat({ type: "dm", otherHash: item.id });
                      setDmUnread((prev) => {
                        if (!prev[item.id]) return prev;
                        const next = { ...prev };
                        delete next[item.id];
                        return next;
                      });
                    } else {
                      setSelectedChat({ type: "group", groupId: item.id });
                      if (currentIdentityHash) {
                        
                        
                        
                        
                        markGroupOpened(item.id).catch(() => {});
                        setGroupUnread((prev) => {
                          if (!(item.id in prev)) return prev;
                          const next = { ...prev };
                          delete next[item.id];
                          return next;
                        });
                      }
                    }
                  }}
                >
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Image src={cardbg} alt="card bg" fill className="object-cover rounded-[20px]" />
                    <div className="absolute inset-0 bg-black/40 rounded-[20px]" />
                  </div>
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-[6px]">
                      {item.kind === "dm" ? (
                        
                        
                        
                        
                        
                        <Avatar
                          url={item.avatarUrl}
                          avatarId={item.avatarId}
                          name={item.name}
                          hash={item.id}
                          size={40}
                        />
                      ) : (
                        <Image
                          src={env.GROUP_AVATARS?.[item.avatarId] || env.GROUP_AVATARS?.[0]}
                          alt="avatar"
                          width={40}
                          height={40}
                          className="rounded-full h-[40px]"
                        />
                      )}
                      <span className="xl:text-[13.78px] text-[10px] text-white font-sora">{item.name}</span>
                      {item.kind === "group" && (
                        <span className="bg-white px-[6px] py-[2px] rounded-full text-black text-[8px] xl:text-[10px]">
                          Group
                        </span>
                      )}
                      {item.kind === "group" && item.isPublic && !item.isMember && (
                        <span className="bg-[#3730EA] px-[6px] py-[2px] rounded-full text-white text-[8px] xl:text-[10px]">
                          Join
                        </span>
                      )}
                    </div>
                    <span className="text-[#9AA4C7] font-sora text-[7px] xl:text-[9.64px]">
                      {formatTime(item.ts)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-[10px] relative z-10">
                    <span className="text-[#9AA4C7] text-[10px] xl:text-[12px] flex-1 truncate pr-2">
                      {item.lastMessage || "No messages yet…"}
                    </span>
                    {(() => {
                      const count = item.kind === "dm" ? dmUnread[item.id] : groupUnread[item.id];
                      if (!count) return null;
                      return (
                        <span className="min-w-[18px] h-[18px] px-[5px] rounded-full bg-[#3730EA] text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                          {count > 99 ? "99+" : count}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          )}
          {groupsLoading && activeTab !== "chats" && (
            <p className="text-center text-xs text-white/50">Loading groups…</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .inbox-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .inbox-scroll::-webkit-scrollbar-thumb {
          background-color: #3730ea;
          border-radius: 10px;
        }
        .inbox-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default InboxContent;
