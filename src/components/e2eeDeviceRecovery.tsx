"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiLock, FiRefreshCw, FiShield } from "react-icons/fi";
import { useDevice } from "@/src/contexts/DeviceContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";

const E2EEDeviceRecovery = () => {
  const {
    vaultExists,
    vaultUnlocked,
    backupVault,
    restoreVault,
    startDeviceLink,
    pollDeviceLink,
    approveDeviceLink,
    hasIdentityKey,
  } = useDevice();
  const { activeIdentityHash, activeSubProfile } = useSubProfile();
  const [passphrase, setPassphrase] = useState("");
  const [syncCode, setSyncCode] = useState("");
  const [approveCode, setApproveCode] = useState("");
  const [busy, setBusy] = useState(false);

  const hasKey = useMemo(
    () => hasIdentityKey(activeIdentityHash),
    [activeIdentityHash, hasIdentityKey, vaultUnlocked]
  );

  if (!activeIdentityHash) return null;

  const run = async (fn: () => Promise<void>) => {
    try {
      setBusy(true);
      await fn();
    } catch (e: any) {
      toast.error(e?.message || "E2EE action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="mx-auto mb-4 w-full max-w-[690px] rounded-[20px] border border-white/15 bg-black/35 p-4 text-white backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2">
          <FiLock className="text-[#A19DFF]" />
          <span className="font-spaceGrotesk text-sm font-semibold">
            Restore {activeSubProfile?.name || "subprofile"} keys
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            type="password"
            placeholder={vaultExists ? "Recovery passphrase" : "No vault saved yet"}
            disabled={!vaultExists || busy}
            className="min-h-[42px] flex-1 rounded-full border border-white/10 bg-white/10 px-4 text-sm outline-none placeholder:text-white/40"
          />
          <button
            disabled={!vaultExists || !passphrase || busy}
            onClick={() =>
              run(async () => {
                await restoreVault(passphrase);
                window.location.reload();
              })
            }
            className="min-h-[42px] rounded-full bg-[#3730EA] px-5 text-sm font-medium text-white disabled:opacity-50"
          >
            Restore
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={syncCode}
            onChange={(e) => setSyncCode(e.target.value)}
            placeholder="Device link code"
            className="min-h-[42px] rounded-full border border-white/10 bg-white/10 px-4 text-sm outline-none placeholder:text-white/40"
          />
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const res = await startDeviceLink();
                  setSyncCode(res.syncCode);
                  toast.success(`Code: ${res.syncCode}`);
                })
              }
              className="min-h-[42px] rounded-full border border-white/15 px-4 text-sm"
            >
              Start
            </button>
            <button
              disabled={!syncCode || busy}
              onClick={() =>
                run(async () => {
                  await pollDeviceLink(syncCode);
                  window.location.reload();
                })
              }
              className="min-h-[42px] rounded-full border border-white/15 px-4 text-sm"
            >
              Poll
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-[690px] flex-col gap-2 rounded-[20px] border border-white/10 bg-white/[0.04] p-3 text-white sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-2 text-xs text-white/70">
        <FiShield className="text-[#A19DFF]" />
        <span>{vaultExists ? "Recovery backup ready" : "Add recovery backup"}</span>
      </div>
      <input
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        type="password"
        placeholder="Recovery passphrase"
        className="min-h-[36px] flex-1 rounded-full border border-white/10 bg-white/10 px-3 text-xs outline-none placeholder:text-white/35"
      />
      <button
        disabled={!passphrase || busy}
        onClick={() =>
          run(async () => {
            await backupVault(passphrase);
            toast.success("Recovery vault saved");
          })
        }
        className="min-h-[36px] rounded-full bg-[#3730EA] px-4 text-xs font-medium disabled:opacity-50"
      >
        Save
      </button>
      <div className="flex gap-2">
        <input
          value={approveCode}
          onChange={(e) => setApproveCode(e.target.value)}
          placeholder="Approve code"
          className="min-h-[36px] w-[120px] rounded-full border border-white/10 bg-white/10 px-3 text-xs outline-none placeholder:text-white/35"
        />
        <button
          disabled={!approveCode || busy}
          onClick={() => run(() => approveDeviceLink(approveCode))}
          className="flex min-h-[36px] items-center gap-1 rounded-full border border-white/15 px-3 text-xs disabled:opacity-50"
        >
          <FiRefreshCw /> Approve
        </button>
      </div>
    </div>
  );
};

export default E2EEDeviceRecovery;
