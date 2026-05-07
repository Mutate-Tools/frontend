"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiFile,
  FiImage,
  FiFilm,
  FiPaperclip,
  FiAlertCircle,
  FiDownload,
  FiX,
  FiPlay,
} from "react-icons/fi";
import { useChat, AttachmentMeta } from "../contexts/ChatContext";
import { storageUtil } from "../utils/crypto/storage-util";
import { decryptFileBytes } from "../utils/crypto/file-crypto-util";

type Target =
  | { type: "dm"; otherHash: string }
  | { type: "group"; groupId: string };

type AttachmentEntry = {
  id: string;
  timestamp: number;
  meta: AttachmentMeta;
};

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

const isImage = (mime?: string) => !!mime && mime.startsWith("image/");
const isVideo = (mime?: string) => !!mime && mime.startsWith("video/");
const isMedia = (mime?: string) => isImage(mime) || isVideo(mime);

const formatFileSize = (bytes: number): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const downloadAttachment = async (att: AttachmentMeta) => {
  try {
    let blobUrl: string;
    let revoke = false;
    const isEncrypted = !!att.key && !!att.nonce;
    if (isEncrypted) {
      const res = await fetch(att.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const plaintext = decryptFileBytes(buf, att.key!, att.nonce!);
      const blob = new Blob([plaintext as BlobPart], {
        type: att.mime || "application/octet-stream",
      });
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

type TileState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; objectUrl: string }
  | { status: "error" };

type GalleryTileProps = {
  att: AttachmentMeta;
  onOpen: (meta: AttachmentMeta, objectUrl: string) => void;
};

const GalleryTile: React.FC<GalleryTileProps> = ({ att, onOpen }) => {
  const isEncrypted = !!att.key && !!att.nonce;
  const [state, setState] = useState<TileState>(
    isEncrypted ? { status: "idle" } : { status: "ready", objectUrl: att.url }
  );
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
    if (!isEncrypted) return;
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      try {
        const res = await fetch(att.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = new Uint8Array(await res.arrayBuffer());
        const plaintext = decryptFileBytes(buf, att.key!, att.nonce!);
        if (cancelled) return;
        const blob = new Blob([plaintext as BlobPart], {
          type: att.mime || "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = url;
        setState({ status: "ready", objectUrl: url });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [att.url, att.key, att.nonce, att.mime, isEncrypted]);

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="aspect-square rounded-md bg-white/5 animate-pulse" />
    );
  }
  if (state.status === "error") {
    return (
      <div className="aspect-square rounded-md bg-white/5 border border-white/5 flex items-center justify-center">
        <FiAlertCircle className="text-white/30" size={18} />
      </div>
    );
  }

  const url = state.objectUrl;
  return (
    <button
      type="button"
      onClick={() => onOpen(att, url)}
      className="relative aspect-square rounded-md overflow-hidden bg-black/30 border border-white/5 group hover:border-white/20 transition cursor-zoom-in"
    >
      {isImage(att.mime) ? (
        <img
          src={url}
          alt={att.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <>
          <video
            src={url}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
              <FiPlay className="text-white" size={14} />
            </div>
          </div>
        </>
      )}
    </button>
  );
};

type Tab = "media" | "files";

type Props = {
  target: Target;
  compact?: boolean;
};

const ChatAttachmentsPanel: React.FC<Props> = ({ target, compact }) => {
  const { currentIdentityHash, messages, groupMessages } = useChat();
  const [tab, setTab] = useState<Tab>("media");
  const [attachments, setAttachments] = useState<AttachmentEntry[]>([]);
  const [lightbox, setLightbox] = useState<{ meta: AttachmentMeta; url: string } | null>(null);

  const activeKey =
    target.type === "dm" ? `dm:${target.otherHash}` : `group:${target.groupId}`;

  useEffect(() => {
    if (!currentIdentityHash) return;
    const me = currentIdentityHash.toLowerCase();
    let cancelled = false;
    (async () => {
      try {
        const rows =
          target.type === "dm"
            ? await storageUtil.getChatHistory(me, target.otherHash)
            : await storageUtil.getGroupHistory(me, target.groupId);
        const collected: AttachmentEntry[] = [];
        for (const row of rows) {
          const meta = parseAttachment(row.message);
          if (meta) collected.push({ id: row._id, timestamp: row.timestamp, meta });
        }
        collected.sort((a, b) => b.timestamp - a.timestamp);
        if (!cancelled) setAttachments(collected);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [currentIdentityHash, activeKey, messages, groupMessages, target]);

  const media = useMemo(() => attachments.filter((a) => isMedia(a.meta.mime)), [attachments]);
  const files = useMemo(() => attachments.filter((a) => !isMedia(a.meta.mime)), [attachments]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const wrapClass = compact ? "" : "mt-4";

  return (
    <div className={`flex flex-col gap-3 ${wrapClass}`}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("media")}
          className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-full transition ${
            tab === "media"
              ? "bg-[#3730EA] text-white"
              : "border border-white/15 text-white/70 hover:text-white"
          }`}
        >
          <FiImage size={11} /> Media
          {media.length > 0 && <span className="opacity-75">· {media.length}</span>}
        </button>
        <button
          type="button"
          onClick={() => setTab("files")}
          className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-full transition ${
            tab === "files"
              ? "bg-[#3730EA] text-white"
              : "border border-white/15 text-white/70 hover:text-white"
          }`}
        >
          <FiFile size={11} /> Files
          {files.length > 0 && <span className="opacity-75">· {files.length}</span>}
        </button>
      </div>

      {tab === "media" && (
        <>
          {media.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8 text-white/40 text-[11px]">
              <FiFilm size={20} />
              <span>No media yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {media.map((item) => (
                <GalleryTile
                  key={item.id}
                  att={item.meta}
                  onOpen={(meta, url) => setLightbox({ meta, url })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "files" && (
        <>
          {files.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8 text-white/40 text-[11px]">
              <FiPaperclip size={20} />
              <span>No files yet</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
                    <FiFile className="text-white/70" size={14} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white text-[11px] truncate">{item.meta.name}</span>
                    <span className="text-white/40 text-[10px]">
                      {formatFileSize(item.meta.size || 0)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(item.meta)}
                    aria-label="Download"
                    className="text-white/70 hover:text-white p-1 flex-shrink-0"
                  >
                    <FiDownload size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="Close"
          >
            <FiX size={28} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadAttachment(lightbox.meta);
            }}
            className="absolute top-4 right-16 text-white/80 hover:text-white"
            aria-label="Download"
          >
            <FiDownload size={22} />
          </button>
          {isImage(lightbox.meta.mime) ? (
            <img
              src={lightbox.url}
              alt={lightbox.meta.name}
              className="max-w-full max-h-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={lightbox.url}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatAttachmentsPanel;
