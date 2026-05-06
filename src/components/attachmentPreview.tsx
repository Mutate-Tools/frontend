"use client";

import React, { useEffect, useState } from "react";
import { FiX, FiFile, FiSend } from "react-icons/fi";

type Props = {
  file: File;
  uploading: boolean;
  onCancel: () => void;
  onSend: (caption: string) => void | Promise<void>;
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AttachmentPreview: React.FC<Props> = ({ file, uploading, onCancel, onSend }) => {
  const [caption, setCaption] = useState("");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const isMedia = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!isMedia) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSend = async () => {
    if (uploading) return;
    await onSend(caption.trim());
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F0F14] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-base font-semibold">Send attachment</h2>
          <button
            onClick={onCancel}
            disabled={uploading}
            className="text-white/60 hover:text-white disabled:opacity-40"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center rounded-xl bg-white/5 border border-white/10 min-h-[180px] p-3">
          {objectUrl && file.type.startsWith("image/") && (
            <img
              src={objectUrl}
              alt={file.name}
              className="max-h-[320px] max-w-full rounded-lg object-contain"
            />
          )}
          {objectUrl && file.type.startsWith("video/") && (
            <video
              src={objectUrl}
              controls
              className="max-h-[320px] max-w-full rounded-lg"
            />
          )}
          {!objectUrl && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center">
                <FiFile className="text-white text-xl" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white text-sm truncate max-w-[260px]">{file.name}</span>
                <span className="text-white/50 text-xs">{formatFileSize(file.size)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="text-white/60 text-xs">
          {file.name} · {formatFileSize(file.size)}
        </div>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Add a caption (optional)…"
          disabled={uploading}
          className="w-full rounded-full px-4 py-3 border border-[#EAF0FF1A] bg-transparent text-white outline-none text-sm disabled:opacity-60"
        />

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="flex-1 h-11 rounded-full border border-white/20 text-white/80 hover:bg-white/10 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={uploading}
            className="flex-1 h-11 rounded-full bg-[#3730EA] text-white font-medium hover:bg-[#4338CA] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {uploading ? (
              "Uploading…"
            ) : (
              <>
                Send <FiSend size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentPreview;
