"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiCamera, FiX } from "react-icons/fi";
import defaultlogo from "@assets/dapp/defaultlogo.svg";
import env from "../constants/environment";
import { useAuth } from "../contexts/AuthContext";
import E2EESettingsSection from "./e2eeSettingsSection";

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;
const WALLET_RE = /^0x[a-f0-9]{40}$/i;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const MobileProfile: React.FC = () => {
  const router = useRouter();
  const { profile, updateProfile, uploadProfileAvatar, disconnect } = useAuth();

  const [username, setUsername] = useState(profile?.username || "");
  const [walletAddress, setWalletAddress] = useState(profile?.walletAddress || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(profile?.username || "");
    setWalletAddress(profile?.walletAddress || "");
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
      });
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    disconnect();
    router.push("/chat");
  };

  return (
    <div className="relative bg-InboxBg p-4 pb-28 flex flex-col items-center">
      <div className="flex items-center border-b border-white/20 pb-3 mb-6 w-full">
        <h1 className="text-white text-lg font-semibold w-full">Profile & Settings</h1>
      </div>

      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10">
          <Image src={avatarSrc} alt="Profile" fill className="object-cover" unoptimized={!!(avatarPreview || profile?.avatarUrl)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 text-xs text-white/85">
            <FiCamera /> Change
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
              className="inline-flex h-9 items-center gap-1 rounded-full border border-white/15 px-3 text-xs text-white/65"
            >
              <FiX /> Remove
            </button>
          )}
        </div>
        <span className="text-white text-base font-medium">
          {profile?.username || "Guest"}
        </span>
      </div>

      <div className="w-full max-w-[364px] bg-white/10 p-5 rounded-[20px] flex flex-col gap-4">
        <div>
          <label className="block text-[#EAF0FF] mb-2 text-sm">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alice"
            className="w-full h-[52px] px-4 rounded-full border border-white/20 text-white text-[16px] bg-transparent outline-none focus:border-[#7B61FF]"
          />
        </div>

        <div>
          <label className="block text-[#EAF0FF] mb-2 text-sm">Wallet Address</label>
          <input
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x…"
            className="w-full h-[52px] px-4 rounded-full border border-white/20 text-white text-[16px] bg-transparent outline-none focus:border-[#7B61FF]"
          />
        </div>

        <div className="flex justify-center py-[10px]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-[44px] px-6 rounded-full text-sm text-white bg-[#3730EA] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-4 w-full max-w-[364px]">
        <E2EESettingsSection compact />
      </div>

      <button
        onClick={handleLogout}
        className="mt-4 w-full max-w-[364px] h-[52px] rounded-[20px] text-[#FF2D46] bg-white/10"
      >
        Log out
      </button>
    </div>
  );
};

export default MobileProfile;
