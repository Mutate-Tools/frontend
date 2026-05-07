"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { FiAlertTriangle } from "react-icons/fi";
import toast from "react-hot-toast";
import env from "@/src/constants/environment";
import { useSubProfile, SubProfile } from "@/src/contexts/SubProfileContext";

type DeleteProfileModalProps = {
  isOpen: boolean;
  subProfile: SubProfile | null;
  onClose: () => void;
  onDeleted?: () => void;
};

















const DeleteProfileModal: React.FC<DeleteProfileModalProps> = ({
  isOpen,
  subProfile,
  onClose,
  onDeleted,
}) => {
  const { deleteSubProfile } = useSubProfile();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (!subProfile) return;
    if (confirmText.trim().toLowerCase() !== subProfile.name.toLowerCase()) {
      toast.error("Type the sub-profile name to confirm");
      return;
    }
    try {
      setDeleting(true);
      await deleteSubProfile(subProfile.identityHash);
      toast.success("Sub-profile deleted");
      setConfirmText("");
      onDeleted?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !subProfile) return null;

  const avatarSrc: any =
    subProfile.avatarUrl ||
    env.GROUP_AVATARS?.[subProfile.avatarId ?? 0] ||
    env.GROUP_AVATARS?.[0];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="relative bg-[#FFFFFF1A] backdrop-blur-md w-full max-w-[500px] max-h-[90vh] overflow-y-auto p-8 rounded-2xl border border-white/10 flex flex-col"
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
              Delete Sub-profile
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
              <Image
                src={avatarSrc}
                alt={subProfile.name}
                width={80}
                height={80}
                unoptimized={!!subProfile.avatarUrl}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-white text-lg font-medium">{subProfile.name}</p>
          </div>

          <div className="bg-[#EA303033]/40 border border-[#EA3030]/40 rounded-xl p-4 mb-6 flex gap-3">
            <FiAlertTriangle className="text-[#EA3030] text-xl flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#EAF0FF] leading-relaxed">
              <p className="font-medium text-[#EA3030] mb-1">
                This cannot be undone.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>All direct messages sent from this sub-profile are deleted.</li>
                <li>
                  You will be removed from every group this sub-profile has
                  joined.
                </li>
                <li>
                  Peers can no longer decrypt future messages under this
                  identity.
                </li>
                <li>
                  Your account's total points are preserved (this sub-profile's
                  contribution stays in the parent total).
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[#EAF0FF] mb-2 text-sm">
              Type <span className="font-mono text-white">{subProfile.name}</span> to
              confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={subProfile.name}
              className="w-full h-[52px] px-4 rounded-full border border-white/20 text-white text-[16px] bg-transparent outline-none focus:border-[#EA3030]"
            />
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="h-[44px] px-6 rounded-full text-sm text-white bg-white/10 hover:bg-white/20 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={
                deleting ||
                confirmText.trim().toLowerCase() !== subProfile.name.toLowerCase()
              }
              className="h-[44px] px-6 rounded-full text-sm text-white bg-[#EA3030] hover:opacity-90 transition disabled:opacity-40"
              style={{
                boxShadow:
                  "inset 2px 2px 8px #FFFFFF8F, inset -2px -2px 8px #FFFFFF2F",
              }}
            >
              {deleting ? "Deleting…" : "Delete sub-profile"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeleteProfileModal;
