"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiPlus, FiSettings, FiCheck, FiUsers } from "react-icons/fi";
import env from "@/src/constants/environment";
import { useSubProfile } from "@/src/contexts/SubProfileContext";
import AddProfileModal from "./modals/addProfileModal";
import ManageProfilesModal from "./modals/manageProfilesModal";












const ProfileSwitcher: React.FC = () => {
  const {
    subProfiles,
    activeSubProfile,
    activeIdentityHash,
    switchSubProfile,
  } = useSubProfile();

  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);




  
  
  
  
  const hasActive = !!activeSubProfile;
  const activeName = activeSubProfile?.name || "Manage Sub-profiles";
  const activeAvatarId = activeSubProfile?.avatarId ?? 0;
  const activeAvatarUrl = activeSubProfile?.avatarUrl || null;

  const activeAvatarSrc: any =
    activeAvatarUrl || env.GROUP_AVATARS?.[activeAvatarId] || env.GROUP_AVATARS?.[0];

  const capped = subProfiles.length >= 5;

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 flex-shrink-0 flex items-center justify-center bg-white/10">
            {hasActive ? (
              <Image
                src={activeAvatarSrc}
                alt={activeName}
                width={28}
                height={28}
                unoptimized={!!activeAvatarUrl}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUsers className="text-white/85" size={14} />
            )}
          </div>
          <span className="text-white text-sm font-medium max-w-[160px] truncate">
            {activeName}
          </span>
          <FiChevronDown
            className={`text-white/60 transition ${open ? "rotate-180" : ""}`}
            size={14}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-[260px] bg-[#1A1A24] border border-white/10 rounded-2xl shadow-xl z-40 overflow-hidden"
              role="menu"
            >
              <div className="max-h-[260px] overflow-y-auto py-1">
                {subProfiles.length === 0 && (
                  <p className="text-xs text-[#9AA4C7] text-center py-4 px-3">
                    No sub-profiles yet.
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
                    <button
                      key={sp.identityHash}
                      onClick={() => {
                        switchSubProfile(sp.identityHash);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${
                        isActive ? "bg-[#3730EA]/20" : "hover:bg-white/5"
                      }`}
                      role="menuitem"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                        <Image
                          src={avatarSrc}
                          alt={sp.name}
                          width={32}
                          height={32}
                          unoptimized={!!sp.avatarUrl}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{sp.name}</p>
                        <p className="text-[10px] text-[#9AA4C7] font-mono truncate">
                          {sp.identityHash.slice(0, 12)}…
                        </p>
                      </div>
                      {isActive && (
                        <FiCheck className="text-[#3730EA]" size={16} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-white/10 py-1">
                <button
                  onClick={() => {
                    setOpen(false);
                    if (!capped) setShowAdd(true);
                  }}
                  disabled={capped}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  role="menuitem"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <FiPlus className="text-white" size={14} />
                  </div>
                  <span className="text-white text-sm">
                    {capped ? "Limit reached (5/5)" : "Add sub-profile"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setShowManage(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition"
                  role="menuitem"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <FiSettings className="text-white" size={14} />
                  </div>
                  <span className="text-white text-sm">Manage sub-profiles</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddProfileModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ManageProfilesModal
        isOpen={showManage}
        onClose={() => setShowManage(false)}
      />
    </>
  );
};

export default ProfileSwitcher;
