"use client";

import React, { useCallback, useEffect } from "react";
import Image from "next/image";
import env from "../constants/environment";
import cardbg from "@assets/dapp/cardbg.svg";
import { useChat } from "@/src/contexts/ChatContext";
import { useChatStore } from "@/src/state/chat-store";

const GroupContent: React.FC = () => {
  const {
    currentIdentityHash,
    groups,
    groupsHasMore,
    groupsLoading,
    loadMoreGroups,
    refreshGroups,
    selectedChat,
    setSelectedChat,
  } = useChat();
  const { setActiveInbox } = useChatStore();
  const myHash = (currentIdentityHash || "").toLowerCase();

  useEffect(() => {
    refreshGroups({ reset: true, limit: 10 });
  }, [refreshGroups]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        loadMoreGroups();
      }
    },
    [loadMoreGroups]
  );

  return (
    <div>
      <div className="md:h-[480px] h-[400px] overflow-y-auto pr-2 inbox-scroll" onScroll={handleScroll}>
        <div className="flex flex-col gap-[25px]">
          {groupsLoading && groups.length === 0 ? (
            <div className="flex flex-col gap-[25px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="p-[10px] rounded-[20px] w-full border border-white/10 bg-white/5 animate-pulse h-[100px]"
                />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="text-sm text-white/60">No public groups yet.</p>
          ) : null}
          {groups.map((room) => {
            const isActive = selectedChat?.type === "group" && selectedChat.groupId === room._id;
            const isMember = room.members.some((m) => m.emailHash.toLowerCase() === myHash);
            return (
              <div
                key={room._id}
                className="relative group p-[10px] rounded-[20px] w-full border cursor-pointer border-white/30 bg-[#FFFFFF1A]"
                onClick={() => {
                  setActiveInbox(true);
                  setSelectedChat({ type: "group", groupId: room._id });
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
                <div className="flex items-center gap-2 relative z-10">
                  <Image
                    src={env.GROUP_AVATARS?.[room.avatarId ?? 0] || env.GROUP_AVATARS?.[0]}
                    alt="group avatar"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span className="text-sm text-white">{room.name}</span>
                  <span className="bg-white px-2 py-[2px] rounded-full text-black text-[8px]">
                    {room.isPublic ? "Public" : "Private"}
                  </span>
                  {room.isPublic && !isMember && (
                    <span className="bg-[#3730EA] px-2 py-[2px] rounded-full text-white text-[8px]">
                      Join to view
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-[#9AA4C7] relative z-10">
                  {room.description || "No description"}
                </p>
                <div className="flex justify-between items-center mt-2 relative z-10">
                  <span className="text-[#9AA4C7] text-[10px]">{room.members.length} members</span>
                </div>
              </div>
            );
          })}
          {groupsLoading && groups.length > 0 && (
            <p className="text-center text-xs text-white/50">Loading more groups…</p>
          )}
          {!groupsHasMore && groups.length > 0 && (
            <p className="text-center text-xs text-white/35">You reached the end.</p>
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

export default GroupContent;
