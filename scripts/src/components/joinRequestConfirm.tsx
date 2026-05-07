"use client";

import React from "react";
import Image from "next/image";
import { FiX, FiClock } from "react-icons/fi";
import env from "../constants/environment";
import { GroupDoc } from "../contexts/ChatContext";

type Props = {
  group: GroupDoc;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const JoinRequestConfirm: React.FC<Props> = ({ group, submitting, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0F0F14] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 relative">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="absolute top-3 right-3 text-white/60 hover:text-white disabled:opacity-40"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>

        <div className="w-12 h-12 rounded-full bg-[#3730EA]/20 border border-[#3730EA]/60 flex items-center justify-center">
          <FiClock className="text-[#A19DFF] text-xl" />
        </div>

        <h2 className="text-white text-base font-semibold text-center">Request to join?</h2>

        <div className="flex flex-col items-center gap-1">
          <Image
            src={env.GROUP_AVATARS?.[group.avatarId ?? 0] || env.GROUP_AVATARS?.[0]}
            alt={group.name}
            width={56}
            height={56}
            className="rounded-full"
          />
          <span className="text-white text-sm font-medium text-center">{group.name}</span>
          <span className="text-white/50 text-[11px]">
            {group.members?.length || 0} members
          </span>
        </div>

        <p className="text-white/60 text-[12px] text-center leading-relaxed">
          This is a private group. Admins will review your request before you can join and send
          messages.
        </p>

        <div className="flex gap-2 w-full mt-1">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 h-11 rounded-full border border-white/20 text-white/80 hover:bg-white/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 h-11 rounded-full bg-[#3730EA] text-white font-medium hover:bg-[#4338CA] disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRequestConfirm;
