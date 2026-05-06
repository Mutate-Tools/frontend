"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiArrowLeft, FiKey, FiRefreshCw, FiShield, FiSmartphone } from "react-icons/fi";
import DeviceLinkPanel from "@/src/components/deviceLinkPanel";
import { useAuth } from "@/src/contexts/AuthContext";
import { useDevice } from "@/src/contexts/DeviceContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";

type SetupChoice = "qr" | "fresh" | "recovery" | null;

export default function E2EESetupPage() {
  const router = useRouter();
  const { isConnected, profile, needsProfileCompletion } = useAuth();
  const { subProfiles, loading: subProfilesLoading } = useSubProfile();
  const {
    ready,
    needsE2EEChoice,
    restoreVault,
    markFreshStart,
  } = useDevice();

  const [choice, setChoice] = useState<SetupChoice>(null);
  const [busy, setBusy] = useState(false);
  const [passphrase, setPassphrase] = useState("");

  const isExistingUser = subProfiles.length > 0;

  useEffect(() => {
    if (!isConnected) {
      router.replace("/chat");
      return;
    }
    if (!profile || !ready || subProfilesLoading) return;
    if (needsProfileCompletion) {
      router.replace("/chat/complete-profile");
      return;
    }
    if (!isExistingUser || !needsE2EEChoice) {
      router.replace("/chat/inbox");
    }
  }, [
    isConnected,
    profile,
    ready,
    subProfilesLoading,
    needsProfileCompletion,
    isExistingUser,
    needsE2EEChoice,
    router,
  ]);

  const handleRecoveryRestore = async () => {
    if (!passphrase) {
      toast.error("Enter your recovery passphrase");
      return;
    }
    try {
      setBusy(true);
      await restoreVault(passphrase);
      router.replace("/chat/inbox");
    } catch (e: any) {
      toast.error(e?.message || "Failed to restore recovery vault");
    } finally {
      setBusy(false);
    }
  };

  const handleFreshStart = async () => {
    try {
      setBusy(true);
      await markFreshStart();
      toast.success("This device is ready for new chats");
      router.replace("/chat/inbox");
    } catch (e: any) {
      toast.error(e?.message || "Failed to prepare this device");
    } finally {
      setBusy(false);
    }
  };

  if (!isConnected || !profile || !ready || subProfilesLoading) {
    return <div className="min-h-screen bg-ChatBg1" />;
  }

  if (!isExistingUser || !needsE2EEChoice) {
    return <div className="min-h-screen bg-ChatBg1" />;
  }

  const renderChoicePanel = () => {
    if (choice === "qr") {
      return (
        <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-white backdrop-blur-md">
          <button
            onClick={() => {
              if (busy) return;
              setChoice(null);
            }}
            className="mb-5 inline-flex items-center gap-2 text-sm text-white/70"
          >
            <FiArrowLeft /> Back
          </button>
          <div className="flex flex-col gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3730EA]/80">
              <FiSmartphone className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Link with QR</h1>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Use the same QR controls here and in Settings. The app will handle whether this
                device is new or trusted.
              </p>
            </div>
            <DeviceLinkPanel onLinked={() => router.replace("/chat/inbox")} />
          </div>
        </div>
      );
    }

    if (choice === "recovery") {
      return (
        <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-white backdrop-blur-md">
          <button
            onClick={() => {
              if (busy) return;
              setChoice(null);
            }}
            className="mb-5 inline-flex items-center gap-2 text-sm text-white/70"
          >
            <FiArrowLeft /> Back
          </button>
          <div className="flex flex-col gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3730EA]/80">
              <FiKey className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Use recovery passphrase</h1>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Restore the encrypted vault for this account on this device. Your passphrase stays
                local and never reaches the server.
              </p>
            </div>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter recovery passphrase"
              className="h-[52px] rounded-full border border-white/10 bg-black/20 px-5 text-sm text-white outline-none placeholder:text-white/35"
            />
            <button
              disabled={busy || !passphrase}
              onClick={handleRecoveryRestore}
              className="h-[46px] rounded-full bg-[#3730EA] px-6 text-sm text-white disabled:opacity-50"
            >
              Restore this device
            </button>
          </div>
        </div>
      );
    }

    if (choice === "fresh") {
      return (
        <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-white backdrop-blur-md">
          <button
            onClick={() => {
              if (busy) return;
              setChoice(null);
            }}
            className="mb-5 inline-flex items-center gap-2 text-sm text-white/70"
          >
            <FiArrowLeft /> Back
          </button>
          <div className="flex flex-col gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3730EA]/80">
              <FiRefreshCw className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Fresh start on this device</h1>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Continue with this Google account from now forward. Old chats stay hidden unless
                you restore them later from Settings, but your subprofiles can send and receive new
                messages on this device.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              This applies to the main profile on this device. If you restore later, recovered
              history will merge with the new messages you send and receive now.
            </div>
            <button
              disabled={busy}
              onClick={handleFreshStart}
              className="h-[46px] rounded-full bg-[#3730EA] px-6 text-sm text-white disabled:opacity-50"
            >
              Continue with fresh start
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-white backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3730EA]/80">
            <FiShield className="text-2xl" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold">Choose how to open chat on this device</h1>
          <p className="mt-3 max-w-[620px] text-sm leading-6 text-white/65">
            We found an existing account, but this device does not have usable local chat keys yet.
            Pick one way to continue.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <button
            onClick={() => setChoice("qr")}
            className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-left transition hover:border-[#7B61FF]/60"
          >
            <FiSmartphone className="text-xl text-white" />
            <div className="mt-4 text-lg font-semibold">Show QR</div>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Display a QR on this device, then scan it from an already trusted device.
            </p>
          </button>

          <button
            onClick={() => setChoice("fresh")}
            className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-left transition hover:border-[#7B61FF]/60"
          >
            <FiRefreshCw className="text-xl text-white" />
            <div className="mt-4 text-lg font-semibold">Fresh start</div>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Keep using the same account on this device with a new empty local E2EE state.
            </p>
          </button>

          <button
            onClick={() => setChoice("recovery")}
            className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-left transition hover:border-[#7B61FF]/60"
          >
            <FiKey className="text-xl text-white" />
            <div className="mt-4 text-lg font-semibold">Use recovery passphrase</div>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Restore your encrypted vault on this device without needing another trusted device.
            </p>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-ChatBg1 bg-cover bg-center bg-no-repeat px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[980px] items-center">
        <div className="w-full">{renderChoicePanel()}</div>
      </div>
    </div>
  );
}
