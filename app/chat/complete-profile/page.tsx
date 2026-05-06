"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import env from "@/src/constants/environment";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";
import { useDevice } from "@/src/contexts/DeviceContext";

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;
const WALLET_RE = /^0x[a-f0-9]{40}$/i;
const SUB_NAME_MAX = 30;



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

export default function CompleteProfilePage() {
  const router = useRouter();
  const {
    isConnected,
    profile,
    needsProfileCompletion,
    updateProfile,
    loading: authLoading,
  } = useAuth();
  const { createSubProfile } = useSubProfile();
  const { backupVault, vaultExists } = useDevice();

  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [mainProfileAvatarId, setMainProfileAvatarId] = useState(0);
  const [subProfileName, setSubProfileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [generatedRecovery, setGeneratedRecovery] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isConnected) router.replace("/chat");
  }, [authLoading, isConnected, router]);

  
  
  
  
  
  
  useEffect(() => {
    if (submitting || generatedRecovery) return;
    if (profile && !needsProfileCompletion) router.replace("/chat/inbox");
  }, [profile, needsProfileCompletion, submitting, generatedRecovery, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    const uname = username.trim().toLowerCase();
    if (!USERNAME_RE.test(uname)) {
      setErr("Username must be 3–24 lowercase letters, digits, or underscores.");
      return;
    }

    const wallet = walletAddress.trim();
    if (wallet && !WALLET_RE.test(wallet)) {
      setErr("Wallet must be a 0x + 40 hex characters Ethereum address.");
      return;
    }

    const subName = subProfileName.trim();
    if (!subName) {
      setErr("Enter a name for your first sub-profile.");
      return;
    }
    if (subName.length > SUB_NAME_MAX) {
      setErr(`Sub-profile name must be ${SUB_NAME_MAX} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    try {
      
      await updateProfile({
        username: uname,
        walletAddress: wallet ? wallet.toLowerCase() : null,
        avatarId: mainProfileAvatarId,
      });

      
      
      
      
      
      try {
        await createSubProfile(subName, 0);
      } catch (subErr: any) {
        const msg =
          subErr?.response?.data?.error || subErr?.message || "Failed to create sub-profile";
        toast.error(
          msg === "max_subprofiles"
            ? "You've reached the 5 sub-profile limit"
            : msg === "duplicate_name"
              ? "You already have a sub-profile with that name"
              : msg
        );
        router.replace("/chat/inbox");
        return;
      }

      
      
      
      
      if (!vaultExists) {
        try {
          const recovery = generateRecoveryPassphrase();
          await backupVault(recovery);
          setGeneratedRecovery(recovery);
          
        } catch (vaultErr: any) {
          console.warn(
            "[CompleteProfile] vault backup failed (non-fatal):",
            vaultErr?.message || vaultErr
          );
          router.replace("/chat/inbox");
        }
      } else {
        router.replace("/chat/inbox");
      }
    } catch (e: any) {
      setErr(e.response?.data?.error || e.message || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (generatedRecovery) {
    return (
      <div className="min-h-screen bg-ChatBg1 bg-cover bg-center flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[#0d1020]/90 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4 text-[#EAF0FF]">
          <h1 className="text-2xl font-semibold">Save your recovery passphrase</h1>
          <p className="text-sm text-[#9AA4C7]">
            This is the first key backup for your account. Write it down somewhere private.
            You will need it if you ever want to restore chats and sub-profiles on a new device
            without QR linking.
          </p>
          <div className="rounded-[20px] border border-white/10 bg-[#0B0B16] px-4 py-4 text-center font-mono text-sm break-words">
            {generatedRecovery}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(generatedRecovery);
                toast.success("Recovery passphrase copied");
              }}
              className="h-[44px] flex-1 rounded-full border border-white/15 px-5 text-sm text-white"
            >
              Copy passphrase
            </button>
            <button
              type="button"
              onClick={() => router.replace("/chat/inbox")}
              className="h-[44px] flex-1 rounded-full bg-[#3730EA] px-5 text-sm text-white"
            >
              I saved it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ChatBg1 bg-cover bg-center flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#0d1020]/90 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4 text-[#EAF0FF]"
      >
        <h1 className="text-2xl font-semibold">Complete your profile</h1>
        <p className="text-sm text-[#9AA4C7]">
          Pick a username, link a wallet (optional), and name your first sub-profile.
          Sub-profiles are how you appear to other users in chat — your username and
          wallet stay private to your account.
        </p>

        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alice"
            autoComplete="off"
            className="w-full h-11 rounded-lg bg-black/40 border border-white/10 px-3 outline-none focus:border-[#7B61FF]"
          />
          <p className="text-xs text-[#6f7aa3] mt-1">3–24 lowercase letters, digits, or underscores.</p>
        </div>

        <div>
          <label className="block text-sm mb-1">Wallet address (optional)</label>
          <input
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x…"
            autoComplete="off"
            className="w-full h-11 rounded-lg bg-black/40 border border-white/10 px-3 outline-none focus:border-[#7B61FF]"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Your profile avatar</label>
          <div className="grid grid-cols-6 gap-2 max-h-[160px] overflow-y-auto pr-1">
            {env.GROUP_AVATARS.map((avatar, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMainProfileAvatarId(i)}
                className={`aspect-square w-full rounded-lg overflow-hidden border-2 transition-transform ${
                  mainProfileAvatarId === i
                    ? "border-[#7B61FF] ring-2 ring-[#7B61FF]/40 scale-105"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <Image
                  src={avatar}
                  alt={`Avatar ${i + 1}`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-[#6f7aa3] mt-2">Choose an avatar for your main profile.</p>
        </div>

        <div>
          <label className="block text-sm mb-1">First sub-profile name</label>
          <input
            value={subProfileName}
            onChange={(e) => setSubProfileName(e.target.value)}
            placeholder="e.g. Personal"
            maxLength={SUB_NAME_MAX}
            autoComplete="off"
            className="w-full h-11 rounded-lg bg-black/40 border border-white/10 px-3 outline-none focus:border-[#7B61FF]"
          />
          <p className="text-xs text-[#6f7aa3] mt-1">
            Up to {SUB_NAME_MAX} characters. This is the name peers will see when you
            chat. You can add more sub-profiles or change avatars later.
          </p>
        </div>

        {err && <p className="text-red-400 text-sm">{err}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 rounded-full bg-[#3730EA] text-white font-medium hover:opacity-90 transition disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save & Continue"}
        </button>
      </form>
    </div>
  );
}
