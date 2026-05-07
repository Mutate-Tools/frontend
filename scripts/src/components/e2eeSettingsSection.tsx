"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiShield, FiChevronDown } from "react-icons/fi";
import DeviceLinkPanel from "./deviceLinkPanel";
import { useDevice, TrustedDevice } from "@/src/contexts/DeviceContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";

type Props = {
  compact?: boolean;
};


const deduplicateDevices = (devices: TrustedDevice[]): TrustedDevice[] => {
  const grouped = new Map<string, TrustedDevice>();

  for (const device of devices) {
    const userAgent = device.name || "unknown";
    const existing = grouped.get(userAgent);

    
    if (!existing) {
      grouped.set(userAgent, device);
    } else {
      const existingTime = new Date(existing.lastSeenAt || 0).getTime();
      const currentTime = new Date(device.lastSeenAt || 0).getTime();
      if (currentTime > existingTime) {
        grouped.set(userAgent, device);
      }
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime()
  );
};

const E2EESettingsSection: React.FC<Props> = ({ compact = false }) => {
  const {
    deviceId,
    devices,
    vaultExists,
    backupVault,
    restoreVault,
    revokeDevice,
    hasAnyUsableSubProfile,
  } = useDevice();
  const { subProfiles } = useSubProfile();
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);

  const hasLockedSubProfiles = useMemo(
    () => subProfiles.length > 0 && !hasAnyUsableSubProfile,
    [subProfiles.length, hasAnyUsableSubProfile]
  );

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

  const panelClass = compact
    ? "w-full bg-white/10 p-5 rounded-[20px] flex flex-col gap-4"
    : "w-full bg-[#FFFFFF1A] backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col gap-5";

  return (
    <div className={panelClass}>
      <div>
        <h2 className="text-white text-base font-semibold">E2EE Devices & Keys</h2>
        <p className="mt-1 text-xs text-white/60 leading-relaxed">
          Google sign-in opens your account. Chat history and subprofile keys on this device still
          depend on QR linking or recovery restore.
        </p>
      </div>

      {hasLockedSubProfiles && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100">
          This device has no usable subprofile keys yet. Restore keys here or create a new
          subprofile to start chatting from this device.
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-white text-sm font-medium">
            <FiShield /> Recovery passphrase
          </div>
          <p className="mt-1 text-xs text-white/50">
            Save an encrypted recovery vault or restore it on this device.
          </p>
          <input
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            type="password"
            placeholder={vaultExists ? "Enter recovery passphrase" : "Set recovery passphrase"}
            className="mt-3 w-full h-[42px] rounded-full border border-white/10 bg-white/10 px-4 text-[16px] lg:text-sm text-white outline-none placeholder:text-white/35"
          />
          <div className="mt-3 flex gap-2">
            <button
              disabled={!passphrase || busy}
              onClick={() => run(() => backupVault(passphrase))}
              className="h-[38px] rounded-full bg-[#3730EA] px-4 text-sm text-white disabled:opacity-50"
            >
              {vaultExists ? "Update backup" : "Save backup"}
            </button>
            <button
              disabled={!vaultExists || !passphrase || busy}
              onClick={() => run(() => restoreVault(passphrase))}
              className="h-[38px] rounded-full border border-white/15 px-4 text-sm text-white disabled:opacity-50"
            >
              Restore
            </button>
          </div>
        </div>
      </div>

      <DeviceLinkPanel />

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-white text-sm font-medium">Trusted devices</div>
        <p className="text-xs text-white/40 mt-1">
          Showing unique device/browser combinations. Duplicates from the same device are automatically merged.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {devices.length === 0 && <p className="text-xs text-white/50 mt-2">No trusted devices yet.</p>}
          {deduplicateDevices(devices).map((device) => (
            <div
              key={device.deviceId}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white truncate">{device.name || device.deviceId}</div>
                <div className="text-[11px] text-white/45 font-mono truncate">
                  {device.deviceId}
                </div>
                {device.lastSeenAt && (
                  <div className="text-[10px] text-white/35 mt-0.5">
                    Last used: {new Date(device.lastSeenAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                disabled={device.deviceId === deviceId || device.status === "revoked" || busy}
                onClick={() => run(() => revokeDevice(device.deviceId))}
                className="h-[34px] rounded-full border border-red-400/20 px-3 text-xs text-red-300 disabled:opacity-40 flex-shrink-0"
              >
                {device.deviceId === deviceId ? "Current" : "Revoke"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default E2EESettingsSection;
