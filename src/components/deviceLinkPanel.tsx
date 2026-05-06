"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiCamera, FiMonitor, FiX } from "react-icons/fi";
import { useDevice } from "@/src/contexts/DeviceContext";

const qrUrl = (payload: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`;

type SessionKind = "request" | "approval" | "claimed";

type LinkSession = {
  syncCode: string;
  expiresIn: number;
  kind: SessionKind;
};

type Props = {
  onLinked?: () => void;
};

const DeviceLinkPanel: React.FC<Props> = ({ onLinked }) => {
  const {
    deviceId,
    hasAnyUsableSubProfile,
    startDeviceLink,
    startApprovalOffer,
    claimApprovalOffer,
    pollDeviceLink,
    approveDeviceLink,
  } = useDevice();
  const [session, setSession] = useState<LinkSession | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerId = useId().replace(/:/g, "");

  const helpText = hasAnyUsableSubProfile
    ? "This trusted device can scan a new device QR, or show a QR for a new phone to scan."
    : "This new device can show a QR to a trusted device, or scan a QR shown by a trusted device.";

  const qrPayload = useMemo(() => {
    if (!session) return "";
    if (session.kind === "approval") {
      return JSON.stringify({
        type: "mutate-device-approval",
        syncCode: session.syncCode,
        approverDeviceId: deviceId,
        expiresIn: session.expiresIn,
      });
    }
    return JSON.stringify({
      type: "mutate-device-request",
      syncCode: session.syncCode,
      requesterDeviceId: deviceId,
      expiresIn: session.expiresIn,
    });
  }, [deviceId, session]);

  const run = async (fn: () => Promise<void>) => {
    try {
      setBusy(true);
      await fn();
    } catch (e: any) {
      toast.error(e?.message || "Device link failed");
    } finally {
      setBusy(false);
    }
  };

  const showQr = () =>
    run(async () => {
      const res = hasAnyUsableSubProfile ? await startApprovalOffer() : await startDeviceLink();
      setSession({
        syncCode: res.syncCode,
        expiresIn: res.expiresIn || 120,
        kind: hasAnyUsableSubProfile ? "approval" : "request",
      });
    });

  useEffect(() => {
    if (!scanOpen) return;
    let cancelled = false;

    (async () => {
      try {
        const mod = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new mod.Html5Qrcode(scannerId, { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText: string) => {
            let parsed: any;
            try {
              parsed = JSON.parse(decodedText);
              if (!parsed?.syncCode) throw new Error("Missing syncCode");
            } catch {
              toast.error("That QR code is not a valid device link QR");
              return;
            }

            try {
              await scanner.stop();
              await scanner.clear();
              scannerRef.current = null;
              setScanOpen(false);

              if (parsed.type === "mutate-device-approval") {
                if (hasAnyUsableSubProfile) {
                  toast.error("Use this approval QR on the new device, not the trusted device.");
                  return;
                }
                const claimed = await claimApprovalOffer(String(parsed.syncCode));
                setSession({
                  syncCode: claimed.syncCode,
                  expiresIn: claimed.expiresIn || 120,
                  kind: "claimed",
                });
                toast.success("Approval QR scanned");
                return;
              }

              if (!hasAnyUsableSubProfile) {
                toast.error("This QR must be scanned from a trusted device that already has keys.");
                return;
              }
              await approveDeviceLink(String(parsed.syncCode));
              toast.success("New device approved");
            } catch (e: any) {
              toast.error(e?.message || "Failed to process QR");
            }
          },
          () => {}
        );
      } catch (e: any) {
        toast.error(e?.message || "Unable to start camera scanner");
        setScanOpen(false);
      }
    })();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (!scanner) return;
      Promise.resolve(scanner.stop?.())
        .catch(() => {})
        .then(() => scanner.clear?.())
        .catch(() => {});
      scannerRef.current = null;
    };
  }, [approveDeviceLink, claimApprovalOffer, hasAnyUsableSubProfile, scanOpen, scannerId]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => {
      pollDeviceLink(session.syncCode)
        .then(async (res) => {
          if (session.kind === "approval" && res?.status === "matched" && res?.requesterPublicKey) {
            await approveDeviceLink(session.syncCode);
            setSession(null);
            return;
          }
          if (res?.status === "completed") {
            setSession(null);
            onLinked?.();
          }
        })
        .catch(() => {});
    }, 2500);
    return () => window.clearInterval(timer);
  }, [approveDeviceLink, onLinked, pollDeviceLink, session]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-white text-sm font-medium">QR device link</div>
      <p className="mt-1 text-xs leading-5 text-white/50">{helpText}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={showQr}
          className="h-[40px] rounded-full border border-white/15 px-4 text-sm text-white disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <FiMonitor /> Show QR
          </span>
        </button>
        <button
          disabled={busy}
          onClick={() => setScanOpen(true)}
          className="h-[40px] rounded-full border border-white/15 px-4 text-sm text-white disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <FiCamera /> Scan QR
          </span>
        </button>
        {session && (
          <button
            disabled={busy}
            onClick={() => setSession(null)}
            className="h-[40px] rounded-full border border-white/15 px-4 text-sm text-white disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      {session?.kind !== "claimed" && session && (
        <div className="mt-3 flex flex-col gap-3">
          <img src={qrUrl(qrPayload)} alt="Device link QR" className="h-[220px] w-[220px] rounded-xl bg-white p-2" />
          <p className="text-xs leading-5 text-white/50">
            {session.kind === "approval"
              ? "Scan this from the new device."
              : "Scan this from a trusted device."}
          </p>
        </div>
      )}

      {session?.kind === "claimed" && (
        <p className="mt-3 text-xs leading-5 text-white/50">
          Waiting for the trusted device to finish approval...
        </p>
      )}

      {scanOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-[420px] rounded-[28px] border border-white/10 bg-[#11111f] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-white text-lg font-semibold">Scan QR</div>
                <p className="mt-1 text-xs text-white/55">Point this camera at the device link QR.</p>
              </div>
              <button
                onClick={() => setScanOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white/70"
                aria-label="Close scanner"
              >
                <FiX />
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black">
              <div id={scannerId} className="min-h-[320px] w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceLinkPanel;
