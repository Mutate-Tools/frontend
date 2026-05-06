"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { FiUpload, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import env from "@/src/constants/environment";
import { useSubProfile } from "@/src/contexts/SubProfileContext";
import { useDevice } from "@/src/contexts/DeviceContext";

type AddProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const NAME_MAX = 30;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const RECOVERY_WORDS = [
  "amber", "atlas", "bloom", "cedar", "cinder", "cobalt", "comet", "coral",
  "delta", "ember", "fern", "glow", "harbor", "indigo", "jungle", "lagoon",
  "lunar", "maple", "meadow", "nova", "onyx", "orchid", "pearl", "quartz",
  "raven", "river", "saffron", "solstice", "spruce", "summit", "thunder",
  "topaz", "violet", "willow", "winter", "zephyr",
];

const generateRecoveryPassphrase = () => {
  const picks = crypto.getRandomValues(new Uint32Array(6));
  return Array.from(picks, (value) => RECOVERY_WORDS[value % RECOVERY_WORDS.length]).join("-");
};














const AddProfileModal: React.FC<AddProfileModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createSubProfile, uploadSubProfileAvatar, subProfiles } =
    useSubProfile();
  const { backupVault, vaultExists } = useDevice();

  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState(0);


  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatedRecovery, setGeneratedRecovery] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capped = subProfiles.length >= 5;

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a profile name");
      return;
    }
    if (trimmed.length > NAME_MAX) {
      toast.error(`Name must be ${NAME_MAX} characters or fewer`);
      return;
    }
    if (capped) {
      toast.error("You've reached the 5 sub-profile limit");
      return;
    }
    try {
      setSubmitting(true);
      const isFirstSubprofile = subProfiles.length === 0;



      let avatarUrl: string | null = null;
      if (photoFile) {
        const res = await uploadSubProfileAvatar(photoFile);
        avatarUrl = res.avatarUrl;
      }
      await createSubProfile(trimmed, avatarId, avatarUrl);
      toast.success("Sub-profile created");
      setName("");
      setAvatarId(0);
      clearPhoto();
      if (isFirstSubprofile && !vaultExists) {
        const recovery = generateRecoveryPassphrase();
        await backupVault(recovery);
        setGeneratedRecovery(recovery);
      } else {
        onCreated?.();
        onClose();
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to create sub-profile";
      toast.error(
        msg === "max_subprofiles"
          ? "You've reached the 5 sub-profile limit"
          : msg === "duplicate_name"
          ? "You already have a sub-profile with that name"
          : msg === "file_too_large"
          ? "Photo must be 5 MB or less"
          : msg === "invalid_file_type"
          ? "Unsupported image type"
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
              onClick={() => {
                if (generatedRecovery) {
                  setGeneratedRecovery(null);
                  onCreated?.();
                }
                onClose();
              }}
              className="absolute top-0 left-0 text-white text-xl"
              aria-label="Close"
            >
              <IoArrowBackOutline className="text-white text-lg" />
            </button>
            <span className="text-white text-lg font-medium mx-auto">
              Add Sub-profile
            </span>
          </div>

          {generatedRecovery ? (
            <>
              <div className="mb-6 rounded-[24px] border border-[#7B61FF]/20 bg-black/20 p-5">
                <h3 className="text-white text-lg font-semibold">Save your recovery passphrase</h3>
                <p className="mt-2 text-sm leading-6 text-[#C7D2F4]">
                  This is the first key backup for this account. Write it down somewhere private.
                  You will need it if you want to restore chats and subprofiles on a new device
                  without QR linking.
                </p>
                <div className="mt-4 rounded-[20px] border border-white/10 bg-[#0B0B16] px-4 py-4 text-center font-mono text-sm text-[#EAF0FF] break-words">
                  {generatedRecovery}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(generatedRecovery);
                      toast.success("Recovery passphrase copied");
                    }}
                    className="h-[44px] rounded-full border border-white/15 px-5 text-sm text-white"
                  >
                    Copy passphrase
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedRecovery(null);
                      onCreated?.();
                      onClose();
                    }}
                    className="h-[44px] rounded-full bg-[#3730EA] px-5 text-sm text-white"
                    style={{
                      boxShadow:
                        "inset 2px 2px 8px #FFFFFFBF, inset -2px -2px 8px #FFFFFF4F",
                    }}
                  >
                    I saved it
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
          <div className="mb-6">
            <label className="block text-[#EAF0FF] mb-2 text-sm">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work"
              maxLength={NAME_MAX}
              className="w-full h-[52px] px-4 rounded-full border border-white/20 text-white text-[16px] bg-transparent outline-none focus:border-[#7B61FF]"
            />
            <p className="text-xs text-[#6f7aa3] mt-1">
              Up to {NAME_MAX} characters. Peers will see this name in place of your
              account username when you chat from this sub-profile.
            </p>
          </div>


          <div className="mb-6">
            <label className="block text-[#EAF0FF] mb-3 text-sm">
              Profile photo (optional)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 bg-black/20 flex-shrink-0">
                <Image
                  src={
                    photoPreview ||
                    (env.GROUP_AVATARS?.[avatarId] || env.GROUP_AVATARS?.[0])
                  }
                  alt="Preview"
                  width={80}
                  height={80}
                  unoptimized={!!photoPreview}
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
                  {photoPreview ? "Change photo" : "Upload photo"}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="flex items-center gap-2 px-4 h-[28px] rounded-full text-[#EA3030] text-xs hover:bg-white/5 transition"
                  >
                    <FiX size={14} /> Remove photo
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-[#6f7aa3] mt-2">
              PNG / JPG / WebP / GIF up to 5 MB. Leave empty to use one of the
              preset avatars below instead.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-[#EAF0FF] mb-3 text-sm">
              Preset avatar {photoPreview && <span className="text-[#6f7aa3]">(hidden while photo is set)</span>}
            </label>
            <div
              className={`grid grid-cols-6 gap-3 max-h-[220px] overflow-y-auto pr-1 transition ${
                photoPreview ? "opacity-40 pointer-events-none" : ""
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

          {capped && (
            <p className="text-xs text-[#EA3030] text-center mb-4">
              You've reached the 5 sub-profile limit. Delete one before creating
              another.
            </p>
          )}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting || capped}
              className="h-[44px] px-8 rounded-full text-sm text-white bg-[#3730EA] hover:opacity-90 transition disabled:opacity-60"
              style={{
                boxShadow:
                  "inset 2px 2px 8px #FFFFFFBF, inset -2px -2px 8px #FFFFFF4F",
              }}
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddProfileModal;
