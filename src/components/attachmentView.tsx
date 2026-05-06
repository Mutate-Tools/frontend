"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiDownload, FiFile, FiX, FiLoader } from "react-icons/fi";
import { AttachmentMeta } from "../contexts/ChatContext";
import { decryptFileBytes } from "../utils/crypto/file-crypto-util";

const formatFileSize = (bytes: number): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (mime?: string) => !!mime && mime.startsWith("image/");
const isVideo = (mime?: string) => !!mime && mime.startsWith("video/");

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; objectUrl: string }
  | { status: "error"; message: string };

type Props = {
  att: AttachmentMeta;
};

const AttachmentView: React.FC<Props> = ({ att }) => {
  const isEncrypted = !!att.key && !!att.nonce;
  const needsMedia = isImage(att.mime) || isVideo(att.mime);
  const [state, setState] = useState<LoadState>(
    !isEncrypted ? { status: "ready", objectUrl: att.url } : { status: "idle" }
  );
  const [lightbox, setLightbox] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isEncrypted || !needsMedia) return;
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      try {
        const res = await fetch(att.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = new Uint8Array(await res.arrayBuffer());
        const plaintext = decryptFileBytes(buf, att.key!, att.nonce!);
        if (cancelled) return;
        const blob = new Blob([plaintext as BlobPart], { type: att.mime || "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = url;
        setState({ status: "ready", objectUrl: url });
      } catch (e: any) {
        if (!cancelled) setState({ status: "error", message: e?.message || "Decryption failed" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [att.url, att.key, att.nonce, att.mime, isEncrypted, needsMedia]);

  const handleDownload = async () => {
    try {
      let blobUrl: string;
      let revoke = false;
      if (isEncrypted) {
        const res = await fetch(att.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = new Uint8Array(await res.arrayBuffer());
        const plaintext = decryptFileBytes(buf, att.key!, att.nonce!);
        const blob = new Blob([plaintext as BlobPart], { type: att.mime || "application/octet-stream" });
        blobUrl = URL.createObjectURL(blob);
        revoke = true;
      } else {
        blobUrl = att.url;
      }
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = att.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (revoke) setTimeout(() => URL.revokeObjectURL(blobUrl), 500);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  if (needsMedia) {
    if (state.status === "loading" || state.status === "idle") {
      const label = isImage(att.mime) ? "Loading photo…" : "Loading video…";
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-black/20 min-w-[160px]">
          <FiLoader className="text-white/70 animate-spin" />
          <span className="text-white/70 text-[11px]">{label}</span>
        </div>
      );
    }
    if (state.status === "error") {
      return (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-red-500/20 border border-red-400/30">
          <span className="text-red-200 text-[11px]">Failed to decrypt: {state.message}</span>
        </div>
      );
    }
    const mediaUrl = state.objectUrl;
    return (
      <div className="flex flex-col gap-2">
        {isImage(att.mime) ? (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="block p-0 border-0 bg-transparent cursor-zoom-in"
          >
            <img
              src={mediaUrl}
              alt={att.name}
              className="rounded-lg max-w-full max-h-[260px] object-cover"
            />
          </button>
        ) : (
          <video
            src={mediaUrl}
            controls
            className="rounded-lg max-w-full max-h-[320px]"
          />
        )}
        <div className="flex items-center justify-between gap-2">
          {att.caption ? (
            <p className="leading-relaxed break-words text-[12px] xl:text-sm flex-1">{att.caption}</p>
          ) : (
            <span className="text-white/50 text-[10px] truncate flex-1">{att.name}</span>
          )}
          <button
            type="button"
            onClick={handleDownload}
            title="Download"
            className="text-white/70 hover:text-white flex-shrink-0"
          >
            <FiDownload size={14} />
          </button>
        </div>
        {lightbox && isImage(att.mime) && (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
            onKeyDown={(e) => e.key === "Escape" && setLightbox(false)}
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <FiX size={28} />
            </button>
            <img
              src={mediaUrl}
              alt={att.name}
              className="max-w-full max-h-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex items-center gap-3 p-2 rounded-lg bg-black/20 hover:bg-black/30 transition text-left"
    >
      <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center">
        <FiFile className="text-white text-lg" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-white text-[12px] truncate">{att.name}</span>
        <span className="text-white/50 text-[10px]">{formatFileSize(att.size)}</span>
      </div>
      <FiDownload className="text-white/70 ml-2 flex-shrink-0" />
    </button>
  );
};

export default AttachmentView;
