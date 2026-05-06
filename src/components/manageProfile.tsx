"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { MdLogout } from "react-icons/md";
import { FiCamera, FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import defaultlogo from "@assets/dapp/defaultlogo.svg";
import env from "../constants/environment";
import { useAuth } from "../contexts/AuthContext";
import E2EESettingsSection from "./e2eeSettingsSection";

type ManageProfileProps = {
  onClose: () => void;
};

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;
const WALLET_RE = /^0x[a-f0-9]{40}$/i;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const ManageProfile: React.FC<ManageProfileProps> = ({ onClose }) => {
  const router = useRouter();
  const { profile, updateProfile, uploadProfileAvatar, disconnect } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState(profile?.username || "");
  const [walletAddress, setWalletAddress] = useState(profile?.walletAddress || "");
  const [avatarId, setAvatarId] = useState(profile?.avatarId ?? 0);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(profile?.username || "");
    setWalletAddress(profile?.walletAddress || "");
    setAvatarId(profile?.avatarId ?? 0);
  }, [profile]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const avatarSrc =
    avatarPreview ||
    profile?.avatarUrl ||
    (profile && env.GROUP_AVATARS?.[profile.avatarId ?? 0]) ||
    defaultlogo;

  const handleAvatarFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Profile picture must be 5 MB or smaller.");
      return;
    }
    setAvatarFile(file);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSave = async () => {
    const uname = username.trim().toLowerCase();
    if (!USERNAME_RE.test(uname)) {
      toast.error("Username must be 3–24 lowercase letters, digits, or underscores.");
      return;
    }
    const wallet = walletAddress.trim();
    if (wallet && !WALLET_RE.test(wallet)) {
      toast.error("Wallet must be a 0x-prefixed 40-character hex address.");
      return;
    }
    try {
      setSaving(true);
      if (avatarFile) {
        await uploadProfileAvatar(avatarFile);
        setAvatarFile(null);
      }
      await updateProfile({
        username: uname,
        walletAddress: wallet ? wallet.toLowerCase() : null,
        avatarId,
      });
      toast.success("Profile updated");
      onClose();
      router.push("/chat/inbox");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    disconnect();
    onClose();
    router.push("/chat");
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          ref={cardRef}
          className="relative bg-[#FFFFFF1A] backdrop-blur-md w-full max-w-[560px] max-h-[85vh] overflow-y-auto p-8 rounded-2xl border border-white/10 flex flex-col"
          initial={{ scale: 0.95, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 30 }}
        >
          <div className="flex items-center border-b border-white/20 gap-3 pb-[10px] mb-8">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 text-white text-xl"
            >
              <IoArrowBackOutline className="text-white text-lg" />
            </button>
            <span className="text-white text-lg font-medium mx-auto">Settings</span>
          </div>

          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15">
              <Image src={avatarSrc} alt="Profile" fill className="object-cover" unoptimized={!!(avatarPreview || profile?.avatarUrl)} />
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 text-xs text-white/85 hover:bg-white/15">
                <FiCamera /> Change photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleAvatarFile(e.target.files?.[0] || null)}
                />
              </label>
              {avatarFile && (
                <button
                  onClick={() => setAvatarFile(null)}
                  className="inline-flex h-9 items-center gap-1 rounded-full border border-white/15 px-3 text-xs text-white/65 hover:bg-white/10"
                >
                  <FiX /> Remove
                </button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[#EAF0FF] mb-3 text-sm">
              Preset avatar {avatarFile && <span className="text-[#6f7aa3]">(hidden while photo is set)</span>}
            </label>
            <div
              className={`grid grid-cols-6 gap-2 max-h-[180px] overflow-y-auto pr-1 transition ${
                avatarFile ? "opacity-40 pointer-events-none" : ""
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
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[#EAF0FF] mb-2 text-sm">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alice"
              className="w-full h-[52px] px-4 rounded-full border border-white/20 text-white text-[16px] bg-transparent outline-none focus:border-[#7B61FF]"
            />
            <p className="text-xs text-[#6f7aa3] mt-1">
              3–24 lowercase letters, digits, or underscores.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-[#EAF0FF] mb-2 text-sm">Wallet Address</label>
            <input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x…"
              className="w-full h-[52px] px-4 rounded-full border border-white/20 text-white text-[16px] bg-transparent outline-none focus:border-[#7B61FF]"
            />
          </div>

          <div className="mb-8 flex justify-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-[44px] px-6 rounded-full text-sm text-white bg-[#3730EA] hover:opacity-90 transition disabled:opacity-60"
              style={{
                boxShadow: "inset 2px 2px 8px #FFFFFFBF, inset -2px -2px 8px #FFFFFF4F",
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>

          <div className="mb-8">
            <E2EESettingsSection />
          </div>

          <button
            onClick={handleLogout}
            className="mt-auto mx-auto mb-5 flex items-center justify-center gap-2 text-[#EA3030] max-w-[200px] w-full text-[18px] hover:underline"
          >
            Log out <MdLogout size={22} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ManageProfile;
