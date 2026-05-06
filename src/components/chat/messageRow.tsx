"use client";

import React from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import env from "@/src/constants/environment";
import AttachmentView from "../attachmentView";
import type { AttachmentMeta } from "@/src/contexts/ChatContext";

export interface RenderedChatMessage {
  _id: string;
  isMine: boolean;
  message: string;
  timestampLabel: string;
  senderLabel: string;
  senderAvatar?: string | StaticImageData;
  senderAvatarUnoptimized?: boolean;
  myAvatar?: string | StaticImageData;
  myAvatarUnoptimized?: boolean;
  messageType?: "text" | "file" | "system";
  systemText?: string;
  dmSeen?: boolean;
  showDmTick?: boolean;
  groupReadText?: string | null;
  groupReadTitle?: string;
}

const parseAttachment = (raw: string): AttachmentMeta | null => {
  if (!raw || raw[0] !== "{") return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.kind === "attachment" && typeof parsed.url === "string") {
      return parsed as AttachmentMeta;
    }
  } catch {}
  return null;
};

const MessageRow = ({ msg }: { msg: RenderedChatMessage }) => {
  if (msg.messageType === "system") {
    return (
      <div className="flex justify-center w-full z-10">
        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[11px] italic text-center">
          {msg.systemText || ""}
        </span>
      </div>
    );
  }

  const attachment = parseAttachment(msg.message);
  const senderAvatar = msg.senderAvatar || env.GROUP_AVATARS?.[0];
  const myAvatar = msg.myAvatar || env.GROUP_AVATARS?.[0];

  return (
    <div
      className={`flex items-start gap-2 sm:gap-3 relative w-full ${
        msg.isMine ? "justify-end" : "justify-start"
      }`}
    >
      {!msg.isMine && (
        <Image
          src={senderAvatar}
          alt="profile"
          width={32}
          height={32}
          unoptimized={!!msg.senderAvatarUnoptimized}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0 z-10"
        />
      )}
      <div className="flex flex-col gap-2 flex-1 min-w-0 z-10">
        <div
          className={`p-3 sm:p-4 flex flex-col justify-between rounded-xl transition-all duration-200 ${
            msg.isMine
              ? "bg-[#3730EA] text-white w-full max-w-[260px] sm:max-w-[300px] md:max-w-[360px] ml-auto hover:bg-[#4F46E5] shadow-[inset_4px_4px_8px_#A19DFF]"
              : "bg-[#FFFFFF1A] backdrop-blur-md hover:bg-[#FFFFFF25] text-white w-full max-w-[280px] sm:max-w-[340px] md:max-w-[410px] border border-white/10"
          } z-10`}
        >
          {attachment ? (
            <AttachmentView att={attachment} />
          ) : (
            <p className="leading-relaxed break-words text-[12px] xl:text-sm">
              {msg.message}
            </p>
          )}
          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="text-white/50 text-[10px] xl:text-xs">
              {msg.senderLabel} • {msg.timestampLabel}
            </span>
            <div className="flex items-center gap-1">
              {msg.groupReadText && (
                <span className="text-white/50 text-[10px]" title={msg.groupReadTitle || ""}>
                  {msg.groupReadText}
                </span>
              )}
              {msg.showDmTick &&
                (msg.dmSeen ? (
                  <BsCheckAll className="text-[#A19DFF] text-[14px]" title="Seen" />
                ) : (
                  <BsCheck className="text-white/60 text-[14px]" title="Sent" />
                ))}
            </div>
          </div>
        </div>
      </div>
      {msg.isMine && (
        <Image
          src={myAvatar}
          alt="profile"
          width={32}
          height={32}
          unoptimized={!!msg.myAvatarUnoptimized}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0 z-10"
        />
      )}
    </div>
  );
};

export default React.memo(MessageRow, (prev, next) => {
  const a = prev.msg;
  const b = next.msg;
  return (
    a._id === b._id &&
    a.message === b.message &&
    a.timestampLabel === b.timestampLabel &&
    a.senderLabel === b.senderLabel &&
    a.senderAvatar === b.senderAvatar &&
    a.myAvatar === b.myAvatar &&
    a.dmSeen === b.dmSeen &&
    a.groupReadText === b.groupReadText &&
    a.groupReadTitle === b.groupReadTitle &&
    a.systemText === b.systemText
  );
});
