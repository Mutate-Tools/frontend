"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { FiUpload, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import env from "@/src/constants/environment";
import { useSubProfile, SubProfile } from "@/src/contexts/SubProfileContext";

type EditProfileModalProps = {
  isOpen: boolean;
  subProfile: SubProfile | null;
  onClose: () => void;
};

const NAME_MAX = 30;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"];









const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  subProfile,
  onClose,
}) => {
  const { updateSubProfile, uploadSubProfileAvatar } = useSubProfile();

  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState(0);




  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(
    null
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (subProfile) {
      setName(subProfile.name);
      setAvatarId(subProfile.avatarId ?? 0);
      setExistingAvatarUrl(subProfile.avatarUrl ?? null);
      setPhotoFile(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
      setClearExisting(false);
    }

  }, [subProfile]);

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error("Unsupported image type (png/jpg/webp/gif only)");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Image must be 5 MB or less");
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setClearExisting(false);
  };

  const handleRevertPreset = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    setClearExisting(true);
  };

  const currentPreviewSrc =
    photoPreview ||
    (clearExisting ? null : existingAvatarUrl) ||
    env.GROUP_AVATARS?.[avatarId] ||
    env.GROUP_AVATARS?.[0];

  const handleSave = async () => {
    if (!subProfile) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a profile name");
      return;
    }
    if (trimmed.length > NAME_MAX) {
      toast.error(`Name must be ${NAME_MAX} characters or fewer`);
      return;
    }
    const nameChanged = trimmed !== subProfile.name;
    const avatarChanged = avatarId !== (subProfile.avatarId ?? 0);
    const photoChanged = !!photoFile;
    const revertChanged = clearExisting && !!existingAvatarUrl;
    if (!nameChanged && !avatarChanged && !photoChanged && !revertChanged) {
      onClose();
      return;
    }
    try {
      setSaving(true);



      if (photoChanged && photoFile) {
        await uploadSubProfileAvatar(photoFile, subProfile.identityHash);
      }



      const patch: {
        name?: string;
        avatarId?: number;
        avatarUrl?: string | null;
      } = {};
      if (nameChanged) patch.name = trimmed;
      if (avatarChanged) patch.avatarId = avatarId;
      if (!photoChanged && revertChanged) patch.avatarUrl = null;

      if (Object.keys(patch).length > 0) {
        await updateSubProfile(subProfile.identityHash, patch);
      }

      toast.success("Sub-profile updated");
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to update";
      toast.error(
        msg === "duplicate_name"
          ? "You already have a sub-profile with that name"
          : msg === "file_too_large"
          ? "Photo must be 5 MB or less"
          : msg === "invalid_file_type"
          ? "Unsupported image type"
          : msg
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !subProfile) return null;

  const showPhotoSlot = !!(photoPreview || (existingAvatarUrl && !clearExisting));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="relative bg-[#FFFFFF1A] backdrop-blur-md w-full max-w-[514px] max-h-[90vh] overflow-y-auto p-8 rounded-2xl border border-white/10 flex flex-col"
          initial={{ scale: 0.95, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 30 }}
        >
          <div className="flex items-center border-b border-white/20 gap-3 pb-[10px] mb-6 relative">
            <button
              onClick={onClose}
              className="absolute top-0 left-0 text-white text-xl"
              aria-label="Close"
            >
              <IoArrowBackOutline className="text-white text-lg" />
            </button>
            <span className="text-white text-lg font-medium mx-auto">
              Edit Sub-profile
            </span>
          </div>

          <div className="mb-6">
            <label className="block text-[#EAF0FF] mb-2 text-sm">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work"
              maxLength={NAME_MAX}
              className="w-full h-[52px] px-4 rounded-full border border-white/20 text-white text-[16px] bg-transparent outline-none focus:border-[#7B61FF]"
            />
          </div>

          <div className="mb-6">
            <label className="block text-[#EAF0FF] mb-3 text-sm">
              Profile photo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 bg-black/20 flex-shrink-0">
                <Image
                  src={currentPreviewSrc as any}
                  alt="Preview"
                  width={80}
                  height={80}
                  unoptimized={
                    !!photoPreview ||
                    (!!existingAvatarUrl && !clearExisting && !photoPreview)
                  }
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_MIME.join(",")}
                  onChange={handlePhotoPick}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 h-[36px] rounded-full border border-white/20 text-white text-xs hover:bg-white/10 transition"
                >
                  <FiUpload size={14} />
                  {showPhotoSlot ? "Change photo" : "Upload photo"}
                </button>
                {showPhotoSlot && (
                  <button
                    type="button"
                    onClick={handleRevertPreset}
                    className="flex items-center gap-2 px-4 h-[28px] rounded-full text-[#EA3030] text-xs hover:bg-white/5 transition"
                  >
                    <FiX size={14} /> Use preset avatar instead
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-[#6f7aa3] mt-2">
              PNG / JPG / WebP / GIF up to 5 MB.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-[#EAF0FF] mb-3 text-sm">
              Preset avatar{" "}
              {showPhotoSlot && (
                <span className="text-[#6f7aa3]">(hidden while photo is set)</span>
              )}
            </label>
            <div
              className={`grid grid-cols-6 gap-3 max-h-[220px] overflow-y-auto pr-1 transition ${
                showPhotoSlot ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              {env.GROUP_AVATARS.map((avatar, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarId(i)}
                  className={`aspect-square w-full rounded-full overflow-hidden border-2 transition-transform ${
                    avatarId === i
                      ? "border-white ring-2 ring-[#3730EA] scale-[1.08]"
                      : "border-transparent hover:border-white/30"
                  }`}
                >
                  <Image
                    src={avatar}
                    alt={`Avatar ${i + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-[44px] px-8 rounded-full text-sm text-white bg-[#3730EA] hover:opacity-90 transition disabled:opacity-60"
              style={{
                boxShadow:
                  "inset 2px 2px 8px #FFFFFFBF, inset -2px -2px 8px #FFFFFF4F",
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
