"use client";

import React, { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { FiCopy, FiX } from "react-icons/fi";
import env from "../constants/environment";
import { useChat, GroupDoc } from "../contexts/ChatContext";

type EditGroupProps = {
  group: GroupDoc;
  onClose: () => void;
};

const EditGroup: React.FC<EditGroupProps> = ({ group, onClose }) => {
  const { updateGroup } = useChat();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [avatarId, setAvatarId] = useState<number>(group.avatarId ?? 0);
  const [isPublic, setIsPublic] = useState<boolean>(!!group.isPublic);
  const [submitting, setSubmitting] = useState(false);

  const shareUrl =
    typeof window !== "undefined" && group.shareToken
      ? `${window.location.origin}/g/${group.shareToken}`
      : "";

  const copyShareLink = async () => {
    if (!shareUrl) {
      toast.error("No share link available");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    try {
      setSubmitting(true);
      await updateGroup(group._id, {
        name: name.trim(),
        description: description.trim(),
        avatarId,
        isPublic,
      });
      toast.success("Group updated");
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-md bg-[#0F0F14] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Edit Group</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <FiX size={20} />
          </button>
        </div>

        <label className="text-white/70 text-xs">Group Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full px-4 py-3 border border-[#EAF0FF1A] bg-transparent text-white outline-none text-sm"
        />

        <label className="text-white/70 text-xs">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={200}
          className="w-full rounded-2xl px-4 py-3 border border-[#EAF0FF1A] bg-transparent text-white outline-none resize-none text-sm"
        />

        <label className="text-white/70 text-xs">Visibility</label>
        <div className="flex gap-4">
          {(["private", "public"] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer text-white text-sm capitalize">
              <input
                type="radio"
                checked={isPublic === (t === "public")}
                onChange={() => setIsPublic(t === "public")}
              />
              {t}
            </label>
          ))}
        </div>

        <label className="text-white/70 text-xs">Avatar</label>
        <div className="grid grid-cols-5 gap-2">
          {env.GROUP_AVATARS.map((avatar, i) => (
            <button
              key={i}
              onClick={() => setAvatarId(i)}
              className={`rounded-full overflow-hidden border-2 transition ${
                avatarId === i ? "border-[#3730EA] scale-110" : "border-transparent"
              }`}
            >
              <Image src={avatar} alt={`Avatar ${i + 1}`} width={48} height={48} />
            </button>
          ))}
        </div>

        {shareUrl && (
          <>
            <label className="text-white/70 text-xs">Share Link</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#EAF0FF1A] bg-white/5">
              <span className="flex-1 text-white/80 text-[11px] truncate">{shareUrl}</span>
              <button
                onClick={copyShareLink}
                className="text-white/80 hover:text-white"
                title="Copy link"
              >
                <FiCopy size={14} />
              </button>
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={submitting}
          className="mt-2 h-12 rounded-full bg-[#3730EA] text-white font-medium hover:bg-[#4338CA] transition disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default EditGroup;
