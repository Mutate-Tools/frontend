"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { FiPlus, FiEdit2, FiTrash2, FiCheck } from "react-icons/fi";
import env from "@/src/constants/environment";
import { useSubProfile, SubProfile } from "@/src/contexts/SubProfileContext";
import AddProfileModal from "./addProfileModal";
import EditProfileModal from "./editProfileModal";
import DeleteProfileModal from "./deleteProfileModal";

type ManageProfilesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};






const ManageProfilesModal: React.FC<ManageProfilesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    subProfiles,
    activeIdentityHash,
    switchSubProfile,
  } = useSubProfile();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<SubProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubProfile | null>(null);

  const capped = subProfiles.length >= 5;

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="relative bg-[#FFFFFF1A] backdrop-blur-md w-full max-w-[514px] max-h-[90vh] overflow-hidden p-8 rounded-2xl border border-white/10 flex flex-col"
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
                Manage Sub-profiles
              </span>
            </div>

            <p className="text-xs text-[#9AA4C7] mb-4 leading-relaxed">
              Each sub-profile has its own encryption keys and appears to peers
              as an independent identity. Up to 5 per account.
            </p>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[50vh] pr-1 mb-4">
              {subProfiles.length === 0 && (
                <p className="text-sm text-[#9AA4C7] text-center py-6">
                  You have no sub-profiles yet.
                </p>
              )}
              {subProfiles.map((sp) => {
                const avatarSrc: any =
                  sp.avatarUrl ||
                  env.GROUP_AVATARS?.[sp.avatarId ?? 0] ||
                  env.GROUP_AVATARS?.[0];
                const isActive =
                  activeIdentityHash?.toLowerCase() ===
                  sp.identityHash.toLowerCase();

                return (
                  <div
                    key={sp.identityHash}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                      isActive
                        ? "border-[#3730EA] bg-[#3730EA]/20"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <button
                      onClick={() => switchSubProfile(sp.identityHash)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                        <Image
                          src={avatarSrc}
                          alt={sp.name}
                          width={48}
                          height={48}
                          unoptimized={!!sp.avatarUrl}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {sp.name}
                        </p>
                        <p className="text-[10px] text-[#9AA4C7] font-mono truncate">
                          {sp.identityHash.slice(0, 16)}…
                        </p>
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[11px] text-[#3730EA] bg-white/10 px-2 py-0.5 rounded-full">
                          <FiCheck /> Active
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditTarget(sp)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white"
                        aria-label={`Edit ${sp.name}`}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(sp)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-[#EA3030]/40 text-[#EA3030]"
                        aria-label={`Delete ${sp.name}`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                disabled={capped}
                className="h-[44px] px-8 rounded-full text-sm text-white bg-[#3730EA] hover:opacity-90 transition disabled:opacity-60 flex items-center gap-2"
                style={{
                  boxShadow:
                    "inset 2px 2px 8px #FFFFFFBF, inset -2px -2px 8px #FFFFFF4F",
                }}
              >
                <FiPlus /> {capped ? "Limit reached" : "Add sub-profile"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AddProfileModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
      />
      <EditProfileModal
        isOpen={!!editTarget}
        subProfile={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <DeleteProfileModal
        isOpen={!!deleteTarget}
        subProfile={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default ManageProfilesModal;
