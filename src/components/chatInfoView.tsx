"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { FiAlertTriangle, FiArrowLeft, FiEdit2, FiCopy, FiX } from "react-icons/fi";
import inviteBtn from "@assets/dapp/invitebtn.svg";

import env from "../constants/environment";
import { useAuth } from "../contexts/AuthContext";
import { useChat, SelectedChat } from "../contexts/ChatContext";
import EditGroup from "./editGroup";
import ChatAttachmentsPanel from "./chatAttachmentsPanel";
import {
  avatarForUser,
  displayNameForUser,
  mergeUsersWithDeletedMarkers,
  shouldUseDeletedAvatar,
} from "../utils/deleted-user-util";
import { getBackendUrl } from '@/src/utils/backend-url';

interface UserLite {
  emailHash: string;
  username: string | null;
  avatarId?: number;
  avatarUrl?: string | null;
  deleted?: boolean;
}


interface ChatInfoViewProps {
  chat: SelectedChat;
  onBack: () => void;
}

const ChatInfoView: React.FC<ChatInfoViewProps> = ({ chat, onBack }) => {
  const { token } = useAuth();
  const {
    currentIdentityHash,
    groups,
    leaveGroup,
    removeGroupMember,
    promoteGroupAdmin,
    demoteGroupAdmin,
    manageGroupRequest,
    setSelectedChat,
  } = useChat();
  const [leaving, setLeaving] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, UserLite>>({});
  const [editing, setEditing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null,
  );
  const myHash = (currentIdentityHash || "").toLowerCase();

  const activeGroup = useMemo(
    () =>
      chat?.type === "group"
        ? groups.find((g) => g._id === chat.groupId)
        : undefined,
    [chat, groups],
  );

  const dmOtherHash = chat?.type === "dm" ? chat.otherHash : null;

  useEffect(() => {
    if (!token || !currentIdentityHash) return;
    const toFetch: string[] = [];
    if (dmOtherHash && !userMap[dmOtherHash]) toFetch.push(dmOtherHash);
    if (activeGroup) {
      for (const m of activeGroup.members) {
        if (!userMap[m.emailHash]) toFetch.push(m.emailHash);
      }
      for (const m of activeGroup.pendingMembers || []) {
        if (!userMap[m.emailHash]) toFetch.push(m.emailHash);
      }
    }
    if (toFetch.length === 0) return;
    axios
      .post(
        `${getBackendUrl()}/users/by-hashes`,
        { emailHashes: toFetch },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Identity-Hash": currentIdentityHash.toLowerCase(),
          },
        },
      )
      .then((res) => {
        setUserMap((prev) =>
          mergeUsersWithDeletedMarkers(prev, toFetch, res.data.users || []),
        );
      })
      .catch(() => {});
  }, [dmOtherHash, activeGroup, token, userMap, currentIdentityHash]);

  if (!chat) return null;

  const isAdmin = !!activeGroup?.admins?.some(
    (a) => a.toLowerCase() === myHash,
  );

  const isGroup = chat.type === "group";

  const displayName = isGroup
    ? activeGroup?.name || "Group"
    : dmOtherHash
      ? displayNameForUser(userMap[dmOtherHash], dmOtherHash)
      : "Chat";

  const avatar = isGroup
    ? env.GROUP_AVATARS?.[activeGroup?.avatarId ?? 0] || env.GROUP_AVATARS?.[0]
    : dmOtherHash
      ? avatarForUser(
          userMap[dmOtherHash],
          dmOtherHash,
          env.GROUP_AVATARS?.[userMap[dmOtherHash]?.avatarId ?? 0] ||
            env.GROUP_AVATARS?.[0],
        )
      : env.GROUP_AVATARS?.[0];

  const handleLeave = async () => {
    if (!activeGroup) return;
    try {
      setLeaving(true);
      await leaveGroup(activeGroup._id);
      toast.success("Left group");
      onBack();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to leave group");
    } finally {
      setLeaving(false);
    }
  };

  const handleRemoveMember = async (hash: string) => {
    if (!activeGroup) return;
    try {
      await removeGroupMember(activeGroup._id, hash);
      toast.success("Member removed");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to remove");
    }
  };

  const handlePromoteMember = async (hash: string) => {
    if (!activeGroup) return;
    try {
      await promoteGroupAdmin(activeGroup._id, hash);
      toast.success("Promoted to admin");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to promote");
    }
  };

  const handleDemoteMember = async (hash: string) => {
    if (!activeGroup) return;
    try {
      await demoteGroupAdmin(activeGroup._id, hash);
      toast.success("Removed from admins");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to demote");
    }
  };

  const handleRequestAction = async (
    hash: string,
    action: "approve" | "reject",
  ) => {
    if (!activeGroup) return;
    try {
      setProcessingRequest(hash);
      await manageGroupRequest(activeGroup._id, hash, action);
      toast.success(action === "approve" ? "Approved" : "Rejected");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Action failed");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleBlock = async () => {
    if (!dmOtherHash || !token || !currentIdentityHash) return;
    try {
      setBlocking(true);
      await axios.post(
        `${getBackendUrl()}/friends/block`,
        { targetHash: dmOtherHash.toLowerCase() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Identity-Hash": currentIdentityHash.toLowerCase(),
          },
        },
      );
      toast.success("User blocked");
      setBlockConfirmOpen(false);
      setSelectedChat(null);
      onBack();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to block user");
    } finally {
      setBlocking(false);
    }
  };

  const copyShareLink = async () => {
    if (!activeGroup?.shareToken) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/g/${activeGroup.shareToken}`,
      );
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const pending = activeGroup?.pendingMembers || [];

  return (
    <div className="relative z-10 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <button
          onClick={onBack}
          aria-label="Back to chat"
          className="w-9 h-9 rounded-full hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition"
        >
          <FiArrowLeft className="text-white" size={18} />
        </button>
        <h2 className="text-white font-semibold text-base">
          {isGroup ? "Group Info" : "Contact Info"}
        </h2>
        {isGroup && isAdmin && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto w-9 h-9 rounded-full hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition"
            title="Edit group"
          >
            <FiEdit2 size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll px-5 py-6">
        <div className="flex flex-col items-center gap-2 mb-6">
          <Image
            src={avatar}
            alt={displayName}
            width={96}
            height={96}
            unoptimized={
              chat.type === "dm" &&
              !!dmOtherHash &&
              shouldUseDeletedAvatar(userMap[dmOtherHash], dmOtherHash)
            }
            className="rounded-full w-24 h-24 object-cover"
          />
          <span className="text-white text-xl font-spaceGrotesk mt-2">
            {displayName}
          </span>
          {isGroup && (
            <>
              <span className="text-sm text-white/50">
                {activeGroup?.members?.length || 0} members
                {activeGroup?.isPublic ? " · Public" : " · Private"}
              </span>
              {activeGroup?.description && (
                <p className="text-center text-sm text-white/60 mt-2 max-w-sm">
                  {activeGroup.description}
                </p>
              )}
              {activeGroup?.shareToken && (
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-1.5 mt-3 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition"
                  title="Copy share link"
                >
                  <FiCopy size={11} /> Copy invite link
                </button>
              )}
            </>
          )}
        </div>

        {!isGroup && (
          <div className="mb-5 grid gap-2 sm:grid-cols-3">
            <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/75 hover:bg-white/10">
              Mute
            </button>
            <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/75 hover:bg-white/10">
              Clear chat
            </button>
            <button
              onClick={() => setBlockConfirmOpen(true)}
              disabled={blocking}
              className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-3 text-sm text-red-200 hover:bg-red-500/15 disabled:opacity-60"
            >
              Block
            </button>
          </div>
        )}

        {isGroup && activeGroup && isAdmin && pending.length > 0 && (
          <div className="flex flex-col gap-2 mb-5">
            <span className="text-white/80 text-sm font-medium">
              Pending Requests ({pending.length})
            </span>
            {pending.map((req) => {
              const u = userMap[req.emailHash];
              const label = displayNameForUser(u, req.emailHash);
              const isProcessing = processingRequest === req.emailHash;
              return (
                <div
                  key={req.emailHash}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Image
                      src={avatarForUser(
                        u,
                        req.emailHash,
                        env.GROUP_AVATARS?.[u?.avatarId ?? 0] ||
                          env.GROUP_AVATARS?.[0],
                      )}
                      alt={label}
                      width={26}
                      height={26}
                      unoptimized={shouldUseDeletedAvatar(u, req.emailHash)}
                      className="rounded-full flex-shrink-0"
                    />
                    <span className="text-white text-xs truncate">{label}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        handleRequestAction(req.emailHash, "approve")
                      }
                      disabled={isProcessing}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-[#3730EA] text-white disabled:opacity-60 hover:bg-[#4B45F0] transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleRequestAction(req.emailHash, "reject")
                      }
                      disabled={isProcessing}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-red-400/40 text-red-300 disabled:opacity-60 hover:bg-red-500/10 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isGroup && activeGroup && (
          <div className="flex flex-col gap-2">
            <span className="text-white/80 text-sm font-medium mb-1">
              Members
            </span>
            {activeGroup.members.map((m) => {
              const u = userMap[m.emailHash];
              const label = displayNameForUser(u, m.emailHash);
              const isSelf = m.emailHash.toLowerCase() === myHash;
              const isMemberAdmin = activeGroup.admins?.some(
                (a) => a.toLowerCase() === m.emailHash.toLowerCase(),
              );
              const canDemote =
                isMemberAdmin && (activeGroup.admins?.length ?? 0) > 1;
              return (
                <div
                  key={m.emailHash}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Image
                      src={avatarForUser(
                        u,
                        m.emailHash,
                        env.GROUP_AVATARS?.[u?.avatarId ?? 0] ||
                          env.GROUP_AVATARS?.[0],
                      )}
                      alt={label}
                      width={28}
                      height={28}
                      unoptimized={shouldUseDeletedAvatar(u, m.emailHash)}
                      className="rounded-full flex-shrink-0"
                    />
                    <span className="text-white text-sm truncate">
                      {label}
                      {isSelf && (
                        <span className="ml-1 text-white/50 text-xs">
                          (you)
                        </span>
                      )}
                      {isMemberAdmin && (
                        <span className="ml-1 text-[10px] text-[#9DA3FF] bg-[#3730EA]/20 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </span>
                  </div>
                  {isAdmin && !isSelf && (
                    <div className="flex flex-shrink-0 items-center gap-1">
                      {!isMemberAdmin && (
                        <button
                          onClick={() => handlePromoteMember(m.emailHash)}
                          className="text-xs text-[#A19DFF] hover:text-white px-2 py-1 rounded hover:bg-white/10 transition"
                        >
                          Admin
                        </button>
                      )}
                      {canDemote && (
                        <button
                          onClick={() => handleDemoteMember(m.emailHash)}
                          className="text-xs text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition"
                        >
                          Demote
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(m.emailHash)}
                        className="text-xs text-red-300 hover:text-red-200 px-2 py-1 rounded hover:bg-red-500/10 transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isGroup && activeGroup && (
          <div className="mt-4">
            <ChatAttachmentsPanel
              target={{ type: "group", groupId: activeGroup._id }}
            />
          </div>
        )}
        {chat.type === "dm" && dmOtherHash && (
          <div className="mt-4">
            <ChatAttachmentsPanel
              target={{ type: "dm", otherHash: dmOtherHash }}
            />
          </div>
        )}

        {isGroup && (
          <div className="flex justify-center mt-6 pt-6 border-t border-white/10">
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="flex flex-col items-center gap-1 disabled:opacity-50"
            >
              <Image src={inviteBtn} alt="leave" width={50} height={50} />
              <span className="text-[#EA3030] text-xs">
                {leaving ? "Leaving..." : "Leave Group"}
              </span>
            </button>
          </div>
        )}
      </div>

      {editing && activeGroup && (
        <EditGroup group={activeGroup} onClose={() => setEditing(false)} />
      )}

      {blockConfirmOpen && !isGroup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-[380px] rounded-[22px] border border-white/10 bg-[#101017] p-4 shadow-2xl sm:p-5">
            <button
              type="button"
              onClick={() => !blocking && setBlockConfirmOpen(false)}
              disabled={blocking}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <FiX size={17} />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10 text-red-200">
                <FiAlertTriangle size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="break-words text-[20px] font-semibold leading-6 text-white">
                  Block {displayName}?
                </h3>
                <p className="mt-2 text-[13px] leading-5 text-white/60">
                  This removes your personal chat on both sides and prevents
                  this subprofile from finding or contacting you.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBlockConfirmOpen(false)}
                disabled={blocking}
                className="h-11 rounded-full border border-white/15 text-sm font-semibold text-white/70 hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={blocking}
                className="h-11 rounded-full border border-red-400/30 bg-red-500/20 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-60"
              >
                {blocking ? "Blocking..." : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(55, 48, 234, 0.4);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default ChatInfoView;
