"use client";

import React, { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { FiCheck, FiCopy, FiX } from "react-icons/fi";
import env from "../constants/environment";
import { GroupDoc } from "../contexts/ChatContext";

type Props = {
  group: GroupDoc;
  onOpen: () => void;
  onClose: () => void;
};

const CreateGroupSuccess: React.FC<Props> = ({ group, onOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = group.shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/g/${group.shareToken}`
    : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F0F14] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>

        <div className="w-14 h-14 rounded-full bg-[#3730EA]/20 border border-[#3730EA] flex items-center justify-center">
          <FiCheck className="text-[#A19DFF] text-2xl" />
        </div>

        <h2 className="text-white text-lg font-semibold text-center">Group created</h2>

        <div className="flex flex-col items-center gap-2">
          <Image
            src={env.GROUP_AVATARS?.[group.avatarId ?? 0] || env.GROUP_AVATARS?.[0]}
            alt={group.name}
            width={72}
            height={72}
            className="rounded-full"
          />
          <span className="text-white text-base font-medium text-center">{group.name}</span>
          <span className="bg-[#3730EA] text-white text-[10px] px-3 py-0.5 rounded-full">
            {group.isPublic ? "Public" : "Private"}
          </span>
        </div>

        {shareUrl && (
          <div className="w-full flex flex-col gap-2">
            <span className="text-white/60 text-xs">Invite link</span>
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1 pl-3">
              <span className="text-white/80 text-[11px] truncate flex-1">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full bg-[#3730EA] text-white"
              >
                <FiCopy size={11} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-white/40 text-[10px] leading-relaxed">
              {group.isPublic
                ? "Anyone with this link can join the group."
                : "People with this link can request to join. Admins approve requests."}
            </p>
          </div>
        )}

        <div className="flex gap-2 w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-white/20 text-white/80 hover:bg-white/10"
          >
            Close
          </button>
          <button
            onClick={onOpen}
            className="flex-1 h-11 rounded-full bg-[#3730EA] text-white font-medium hover:bg-[#4338CA]"
          >
            Open Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupSuccess;
