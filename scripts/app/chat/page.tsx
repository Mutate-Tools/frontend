"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import logo from "@assets/logo.svg";
import { useAuth } from "@/src/contexts/AuthContext";
import { useDevice } from "@/src/contexts/DeviceContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";

const telemetry = [
  ["Cipher", "XChaCha20", "text-[#7CF0FF]"],
  ["Curve", "X25519", "text-white"],
  ["Forward Secrecy", "Active", "text-[#7CFFB2]"],
  ["Channel Bind", "SHA-256", "text-[#7C8CFF]"],
];

const capabilities: {
  label: string;
  iconKey: "lock" | "groups" | "shield" | "clock";
}[] = [
  { label: "E2E Encryption", iconKey: "lock" },
  { label: "Private Groups", iconKey: "groups" },
  { label: "Anchored Identity", iconKey: "shield" },
  { label: "Self-Destruct", iconKey: "clock" },
];

const seededValue = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const makeParticles = () =>
  Array.from({ length: 24 }).map((_, index) => ({
    id: index,
    left: `${seededValue(index, 1) * 100}%`,
    size: `${1 + seededValue(index, 2) * 2.5}px`,
    duration: `${14 + seededValue(index, 3) * 22}s`,
    delay: `${-seededValue(index, 4) * 24}s`,
  }));

const StatusClock = () => {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setTime(
        `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="text-white animate-[signinFlicker_6s_linear_infinite]">
      {time}
    </span>
  );
};

const Page = () => {
  const router = useRouter();
  const {
    isConnected,
    needsProfileCompletion,
    profile,
    loading,
    error,
    loginWithIdToken,
  } = useAuth();
  const { ready, needsE2EEChoice } = useDevice();
  const { loading: subProfilesLoading } = useSubProfile();
  const particles = useMemo(makeParticles, []);

  useEffect(() => {
    if (!isConnected || !profile || !ready || subProfilesLoading) return;
    if (needsProfileCompletion) {
      router.replace("/chat/complete-profile");
      return;
    }
    if (needsE2EEChoice) {
      router.replace("/chat/e2ee-setup");
      return;
    }
    let target = "/chat/inbox";
    try {
      const saved = sessionStorage.getItem("post_login_redirect");
      if (saved && (saved.startsWith("/u/") || saved.startsWith("/g/"))) {
        target = saved;
        sessionStorage.removeItem("post_login_redirect");
      }
    } catch {}
    router.replace(target);
  }, [
    isConnected,
    profile,
    ready,
    subProfilesLoading,
    needsProfileCompletion,
    needsE2EEChoice,
    router,
  ]);

  return (
    <div
      className="relative min-h-screen overflow-hidden text-[#EAF1FF]"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(55,48,234,0.55) 0%, rgba(40,30,180,0.35) 30%, rgba(10,8,30,0.85) 70%, #050616 100%), #3730EA",
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[220px] left-1/2 h-[900px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(180,180,255,0.32)_0%,rgba(124,140,255,0.10)_30%,transparent_65%)] blur-3xl" />
        <div className="absolute -bottom-[300px] left-[10%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(160,60,220,0.18)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-[200px] right-[5%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(124,240,255,0.10)_0%,transparent_70%)] blur-3xl" />
        <div className="signin-grid absolute inset-0" />
        <div className="signin-grid-fine absolute inset-0" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(180,200,255,0.022)_0_1px,transparent_1px_4px)] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.86)_100%)]" />
        <div className="signin-arc absolute left-1/2 top-1/2 h-[1400px] w-[1400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#7C8CFF]/8" />
        <div className="signin-arc-reverse absolute left-1/2 top-1/2 h-[1800px] w-[1800px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#7CF0FF]/5" />
        <div className="signin-arc-small absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#7C8CFF]/10" />
        <div className="absolute inset-0">
          {particles.map((p) => (
            <span
              key={p.id}
              className="signin-particle absolute bottom-[-10px] rounded-full bg-[#7C8CFF] shadow-[0_0_8px_#7C8CFF]"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                animationDuration: p.duration,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-5 py-5 sm:px-8 lg:px-14 lg:py-8">
        <header className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.24em] text-white/45 sm:text-[11px]">
          <div className="flex items-center gap-3">
            <div className="relative grid h-9 w-9 place-items-center bg-[#0f1432]/60">
              <Image
                src={logo}
                alt=""
                className="h-auto w-auto max-w-[120px] brightness-125 saturate-125"
                priority
              />
              {/* <span className="pointer-events-none absolute inset-[-1px] border border-transparent bg-[linear-gradient(135deg,#7C8CFF,transparent_50%)] opacity-70 [mask:linear-gradient(#000_0_0)_padding-box,linear-gradient(#000_0_0)] [mask-composite:exclude]" /> */}
            </div>
            <div className="font-spaceGrotesk text-lg font-semibold normal-case tracking-tight text-white">
              {/* Mutate */}
              {/* <span className="ml-2 border border-[#7C8CFF]/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#7C8CFF]">
                v0.9 Beta
              </span> */}
            </div>
          </div>

          <nav className="hidden items-center gap-7 lg:flex">
            <Link href="/whitepaper" className="hover:text-white">
              Whitepaper
            </Link>
            <Link href="/ambassador-program" className="hover:text-white">
              Ambassador Program
            </Link>
            <span className="h-3.5 w-px bg-[#7C8CFF]/40" />
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7CFFB2] shadow-[0_0_10px_#7CFFB2] animate-pulse" />
              Network Stable
            </span>
          </nav>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
          <span>
            <span className="opacity-55">SYS </span>
            <span className="text-white">MTX-CORE</span>
          </span>
          <span className="h-2.5 w-px bg-[#7C8CFF]/40" />
          <span className="hidden sm:inline">
            <span className="opacity-55">Region </span>
            <span className="text-white">EU-WEST CDN</span>
          </span>
          <span className="hidden h-2.5 w-px bg-[#7C8CFF]/40 sm:inline-block" />
          <span className="hidden sm:inline">
            <span className="opacity-55">Relay </span>
            <span className="text-white">047 / 128</span>
          </span>
          <span className="h-px min-w-[80px] flex-1 bg-gradient-to-r from-[#7C8CFF]/50 to-transparent" />
          <span>
            <span className="opacity-55">UTC </span>
            <StatusClock />
          </span>
        </div>

        <main className="grid flex-1 items-center gap-8 py-9 lg:grid-cols-[1fr_minmax(520px,600px)_1fr] lg:gap-10 lg:py-12">
          <aside className="hidden max-w-[280px] flex-col gap-5 justify-self-end xl:flex">
            <TelemetryPanel />
            <Panel
              title="// NETWORK"
              right={<span className="text-[#7CFFB2]">UP 12ms</span>}
            >
              <div className="space-y-3 font-mono text-[10.5px] uppercase tracking-[0.16em]">
                <Stat label="Peers" value="1,284" />
                <Stat label="Relays" value="128 / 128" />
                <Stat
                  label="Uptime"
                  value="99.998%"
                  valueClass="text-[#7CFFB2]"
                />
              </div>
            </Panel>
          </aside>

          <section className="relative px-2">
            <div className="pointer-events-none absolute inset-[-24px] hidden sm:block">
              <span className="absolute left-0 top-0 h-8 w-8 border-l border-t border-[#7C8CFF]" />
              <span className="absolute right-0 top-0 h-8 w-8 border-r border-t border-[#7C8CFF]" />
              <span className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-[#7C8CFF]" />
              <span className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-[#7C8CFF]" />
            </div>

            <div className="mb-7 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.30em] text-[#7C8CFF] sm:text-[11px]">
              <span className="h-px w-9 bg-gradient-to-r from-transparent to-[#7C8CFF]" />
              <span className="h-1.5 w-1.5 bg-[#7C8CFF] shadow-[0_0_12px_#7C8CFF] animate-pulse" />
              <span>Authenticate Step 01 / 01</span>
              <span className="h-1.5 w-1.5 bg-[#7C8CFF] shadow-[0_0_12px_#7C8CFF] animate-pulse" />
              <span className="h-px w-9 bg-gradient-to-l from-transparent to-[#7C8CFF]" />
            </div>

            <h1 className="text-center font-spaceGrotesk text-[40px] font-semibold leading-none tracking-[-0.035em] text-white sm:text-[56px]">
              <span className="signin-shimmer bg-[linear-gradient(180deg,#fff_0%,#B6C2FF_60%,#7C8CFF_100%)] bg-clip-text text-transparent">
                One key. One identity.
              </span>
              <br />
              <span className="signin-shimmer bg-[linear-gradient(180deg,#fff_0%,#7CF0FF_100%)] bg-clip-text text-transparent">
                Encrypted by default.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-[480px] text-center text-sm leading-6 text-white/60 sm:text-base">
              Sign in to Mutate to access end-to-end encrypted conversations and
              private group messaging. Your keys are derived locally. We never
              see them.
            </p>

            <div className="signin-card relative mt-9 border border-[#7C8CFF]/40 bg-[linear-gradient(180deg,rgba(20,24,60,0.55),rgba(8,10,28,0.85))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-7">
              <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-gradient-to-b from-[#7C8CFF] via-[#7CF0FF] to-[#5B68E8] shadow-[0_0_24px_#7C8CFF]" />
              <div className="mb-5 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
                <span className="flex items-center gap-2 text-[#7C8CFF]">
                  <LockIcon /> TLS 1.3 Secure
                </span>
                <span>Session New</span>
              </div>

              <div className="signin-google-shell relative flex min-h-[58px] items-center justify-center bg-[linear-gradient(90deg,#F9FAFF_0%,#EEF3FF_48%,#F8FAFF_100%)] shadow-[0_0_30px_rgba(124,140,255,0.35)]">
                {loading ? (
                  <div className="font-spaceGrotesk text-sm font-semibold text-[#0E1230]">
                    Connecting...
                  </div>
                ) : (
                  <>
                    <div className="pointer-events-none flex w-full items-center justify-center gap-3.5 px-5 font-spaceGrotesk text-[14px] font-semibold tracking-[-0.01em] text-[#17203E] sm:text-[16px]">
                      <GoogleMark />
                      <span>Continue with Google</span>
                      <ArrowIcon />
                    </div>
                    <div className="absolute inset-0 z-10 opacity-[0.01]">
                      <GoogleLogin
                        onSuccess={(cred) => {
                          if (cred.credential)
                            loginWithIdToken(cred.credential);
                        }}
                        onError={() => console.error("[Google] sign-in failed")}
                        theme="filled_black"
                        shape="rectangular"
                        size="large"
                        text="continue_with"
                        width="1000"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.20em] text-white/40 sm:text-[10px]">
                <span className="h-1 w-1 rounded-full bg-[#7C8CFF] shadow-[0_0_8px_#7C8CFF]" />
                <span>Only Google sign-in is supported for now</span>
                <span className="h-1 w-1 rounded-full bg-[#7C8CFF] shadow-[0_0_8px_#7C8CFF]" />
              </div>

              <div className="mt-5 grid gap-3 border-t border-dashed border-[#7C8CFF]/20 pt-5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/40 sm:grid-cols-3">
                <Handshake
                  label="Auth"
                  value="OAuth 2.0"
                  valueClass="text-[#7CFFB2]"
                />
                <Handshake
                  label="Keys"
                  value="Derived Local"
                  valueClass="text-[#7CF0FF]"
                />
                <Handshake
                  label="Server Sees"
                  value="Ciphertext"
                  valueClass="text-white"
                />
              </div>

              {error && (
                <p className="mt-4 text-center text-sm text-red-300">{error}</p>
              )}
            </div>

            <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              By continuing you agree to our{" "}
              <Link
                href="/"
                className="border-b border-[#7C8CFF]/40 text-[#7C8CFF] hover:text-white"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/"
                className="border-b border-[#7C8CFF]/40 text-[#7C8CFF] hover:text-white"
              >
                Privacy Policy
              </Link>
              .
            </div>
          </section>

          <aside className="hidden max-w-[280px] flex-col gap-5 justify-self-start xl:flex">
            <Panel
              title="// CAPABILITIES"
              right={<span className="text-[#7CF0FF]">04</span>}
            >
              <div className="flex flex-col gap-2">
                {capabilities.map(({ label, iconKey }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 border border-[#7C8CFF]/20 bg-[#080A16]/60 px-3 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/60 transition-all duration-200 hover:border-[#7C8CFF]/40 hover:bg-[rgba(20,28,70,0.5)] hover:text-white"
                  >
                    <span className="grid h-3.5 w-3.5 shrink-0 place-items-center text-[#7C8CFF]">
                      <CapabilityIcon type={iconKey} />
                    </span>
                    {label}
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="// WHY GOOGLE" right={<span>i</span>}>
              <p className="text-[12.5px] leading-6 text-white/60">
                OAuth keeps your password off our servers. Mutate derives your
                key on-device. Your Google account is just the door, never the
                vault.
              </p>
              <div className="mt-4 h-[3px] overflow-hidden bg-[#7C8CFF]/15">
                <div className="h-full w-full bg-gradient-to-r from-[#7CFFB2] to-[#7CF0FF]" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[9.5px] uppercase tracking-[0.20em] text-white/40">
                <span>Zero-Knowledge</span>
                <span className="text-[#7CFFB2]">Verified</span>
              </div>
            </Panel>
          </aside>
        </main>

        <footer className="flex flex-col gap-3 border-t border-[#7C8CFF]/20 pt-5 font-mono text-[10px] uppercase tracking-[0.20em] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-[#7C8CFF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C8CFF] shadow-[0_0_10px_#7C8CFF] animate-pulse" />
              System Operational
            </span>
            <span className="hidden h-2.5 w-px bg-[#7C8CFF]/40 sm:block" />
            <span>
              <span className="opacity-55">Build </span>
              <span className="text-white">0.9.14-rc</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>
              <span className="opacity-55">2026 </span>
              <span className="text-white">Mutate Labs</span>
            </span>
            <Link href="/" className="hover:text-white">
              Support
            </Link>
            <Link href="/" className="hover:text-white">
              Status
            </Link>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .signin-grid {
          background-image:
            linear-gradient(rgba(124, 140, 255, 0.055) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(124, 140, 255, 0.055) 1px,
              transparent 1px
            );
          background-size: 80px 80px;
          mask-image: radial-gradient(
            ellipse 90% 70% at 50% 35%,
            #000 30%,
            transparent 80%
          );
          animation: signinGridDrift 30s linear infinite;
        }
        .signin-grid-fine {
          background-image:
            linear-gradient(rgba(124, 140, 255, 0.025) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(124, 140, 255, 0.025) 1px,
              transparent 1px
            );
          background-size: 16px 16px;
          mask-image: radial-gradient(
            ellipse 60% 50% at 50% 45%,
            #000 0%,
            transparent 70%
          );
        }
        .signin-arc {
          animation: signinSpin 90s linear infinite;
        }
        .signin-arc-reverse {
          animation: signinSpinReverse 140s linear infinite;
        }
        .signin-particle {
          opacity: 0;
          animation-name: signinFloatUp;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .signin-shimmer {
          background-size: 200% 100%;
          animation: signinShimmer 6s ease-in-out infinite;
        }
        .signin-card {
          animation: signinBreathe 5s ease-in-out infinite;
        }
        .signin-google-shell {
          position: relative;
          overflow: hidden;
        }
        .signin-google-shell > div[style],
        .signin-google-shell iframe {
          width: 100% !important;
          height: 100% !important;
        }
        .signin-google-shell::before {
          content: "";
          position: absolute;
          top: 0;
          left: -60%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(124, 180, 255, 0.35),
            transparent
          );
          transform: skewX(-20deg);
          animation: signinSweep 3.6s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }
        @keyframes signinGridDrift {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 80px 80px;
          }
        }
        @keyframes signinSpin {
          from {
            transform: translate(-50%, -50%) rotate(0);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        @keyframes signinSpinReverse {
          from {
            transform: translate(-50%, -50%) rotate(0);
          }
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }
        @keyframes signinFloatUp {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh);
            opacity: 0;
          }
        }
        @keyframes signinShimmer {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes signinBreathe {
          0%,
          100% {
            box-shadow:
              0 0 0 1px rgba(124, 140, 255, 0.1),
              0 30px 80px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(180, 195, 255, 0.1),
              0 0 60px rgba(124, 140, 255, 0.1);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(124, 140, 255, 0.18),
              0 30px 80px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(180, 195, 255, 0.1),
              0 0 90px rgba(124, 140, 255, 0.28);
          }
        }
        @keyframes signinSweep {
          0% {
            left: -60%;
          }
          60%,
          100% {
            left: 120%;
          }
        }
        @keyframes signinFlicker {
          0%,
          97%,
          100% {
            opacity: 1;
          }
          98% {
            opacity: 0.4;
          }
          99% {
            opacity: 0.85;
          }
        }
        /* Arc orbital dots */
        .signin-arc::before {
          content: "";
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #7c8cff;
          box-shadow: 0 0 18px #7c8cff;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
        }
        .signin-arc-reverse::before {
          content: "";
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #7cf0ff;
          box-shadow: 0 0 22px #7cf0ff;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
        }
        /* Small arc (900px, 60s forward, white dot) */
        .signin-arc-small {
          animation: signinSpin 60s linear infinite;
        }
        .signin-arc-small::before {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 18px #fff;
          top: -3px;
          left: 50%;
          transform: translateX(-50%);
        }
        /* Live meter scan overlay */
        .signin-meter-live {
          position: relative;
          overflow: hidden;
        }
        .signin-meter-live::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 30%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.5),
            transparent
          );
          animation: signinMeterScan 2.4s linear infinite;
        }
        @keyframes signinMeterScan {
          0% {
            left: -30%;
          }
          100% {
            left: 100%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .signin-grid,
          .signin-arc,
          .signin-arc-reverse,
          .signin-arc-small,
          .signin-particle,
          .signin-shimmer,
          .signin-card,
          .signin-google-shell::before,
          .signin-meter-live::after {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

const Panel = ({
  title,
  right,
  children,
}: {
  title: string;
  right: ReactNode;
  children: ReactNode;
}) => (
  <div className="relative border border-[#7C8CFF]/20 bg-[linear-gradient(180deg,rgba(14,18,40,0.55),rgba(6,8,20,0.75))] p-5 backdrop-blur-md before:absolute before:left-[-1px] before:top-[-1px] before:h-2.5 before:w-2.5 before:border-l before:border-t before:border-[#7C8CFF] after:absolute after:bottom-[-1px] after:right-[-1px] after:h-2.5 after:w-2.5 after:border-b after:border-r after:border-[#7C8CFF]">
    <div className="mb-4 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.28em] text-[#7C8CFF]">
      <span>{title}</span>
      {right}
    </div>
    {children}
  </div>
);

const TelemetryPanel = () => (
  <Panel
    title="// HANDSHAKE.LOG"
    right={
      <span className="flex items-center gap-1.5 text-[#7CFFB2]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#7CFFB2] shadow-[0_0_8px_#7CFFB2] animate-pulse" />
        Live
      </span>
    }
  >
    <div className="space-y-3 font-mono text-[10.5px] uppercase tracking-[0.16em]">
      {telemetry.map(([label, value, color]) => (
        <Stat key={label} label={label} value={value} valueClass={color} />
      ))}
    </div>
    <div className="signin-meter signin-meter-live mt-3 h-[3px] bg-[#7C8CFF]/15">
      <div className="h-full w-[88%] bg-gradient-to-r from-[#7C8CFF] to-[#7CF0FF] shadow-[0_0_12px_#7C8CFF]" />
    </div>
    <div className="mt-2 flex justify-between font-mono text-[9.5px] uppercase tracking-[0.20em] text-white/40">
      <span>Entropy</span>
      <span className="text-[#7CF0FF]">256 bit OK</span>
    </div>
  </Panel>
);

const Stat = ({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex items-baseline justify-between gap-4">
    <span className="text-white/40">{label}</span>
    <span className={`font-medium ${valueClass}`}>{value}</span>
  </div>
);

const Handshake = ({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) => (
  <div className="flex flex-col gap-1">
    <span>{label}</span>
    <span className={`text-[11px] tracking-[0.14em] ${valueClass}`}>
      {value}
    </span>
  </div>
);

const LockIcon = () => (
  <svg
    width="11"
    height="13"
    viewBox="0 0 11 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="0.5" y="5.5" width="10" height="7" stroke="currentColor" />
    <path
      d="M2.5 5.5V3.5C2.5 1.84315 3.84315 0.5 5.5 0.5C7.15685 0.5 8.5 1.84315 8.5 3.5V5.5"
      stroke="currentColor"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7 1l5 2v4c0 3-2.2 5.5-5 6-2.8-.5-5-3-5-6V3l5-2z"
      stroke="currentColor"
    />
  </svg>
);

const LockCapIcon = () => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="2" y="6" width="10" height="7" stroke="currentColor" />
    <path d="M4 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" />
  </svg>
);

const GroupsIcon = () => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="5" cy="5" r="2.5" stroke="currentColor" />
    <circle cx="10" cy="9" r="2.5" stroke="currentColor" />
    <path d="M5 7.5v3M9 6.5l-3-1" stroke="currentColor" />
  </svg>
);

const ClockCapIcon = () => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="5" stroke="currentColor" />
    <path d="M7 4v3l2 2" stroke="currentColor" />
  </svg>
);

const CapabilityIcon = ({
  type,
}: {
  type: "lock" | "groups" | "shield" | "clock";
}) => {
  if (type === "lock") return <LockCapIcon />;
  if (type === "groups") return <GroupsIcon />;
  if (type === "clock") return <ClockCapIcon />;
  return <ShieldIcon />;
};

const GoogleMark = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="shrink-0"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09 0-.73.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg
    width="18"
    height="10"
    viewBox="0 0 18 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="ml-1.5 shrink-0 text-[#686B7D]"
  >
    <path
      d="M1 5H17M17 5L13 1M17 5L13 9"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export default Page;
