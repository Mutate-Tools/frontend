"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiLink,
  FiCopy,
  FiCheck,
  FiX,
  FiAward,
  FiUsers,
  FiTrendingUp,
  FiLock,
  FiCheckCircle,
} from "react-icons/fi";
import rafflebg from "@assets/dapp/rafflecardbg.png";
import { useAuth } from "@/src/contexts/AuthContext";

const getBackendUrl = () => {
  if (typeof window === "undefined") return "http://localhost:8080";
  return (
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8080`
  );
};



interface ReferralsMeV2 {
  referralCode: string | null;
  totalReferrals: number;
  referralPoints: number;
  qualifiedDirectReferrals: number;
  qualifiedLevel2Referrals: number;
  qualifiedLevel3Referrals: number;
  ambassadorTier: "none" | "explorer" | "operator" | "catalyst" | "architect";
  leaderboardScore: number;
  leaderboardRank: number | null;
  claimableMuteBalance: number;
  lockedMuteBalance: number;
  paidMuteBalance: number;
}

interface NetworkReferral {
  maskedId: string;
  referralLevel: 1 | 2 | 3;
  stage1Completed: boolean;
  stage2Completed: boolean;
  stage3Completed: boolean;
  fullyQualified: boolean;
  pendingMute: number;
  claimableMute: number;
}

interface NetworkResponse {
  network: {
    level1: NetworkReferral[];
    level2: NetworkReferral[];
    level3: NetworkReferral[];
  };
}

interface LeaderboardEntry {
  rank: number;
  maskedUserHash: string;
  ambassadorTier: string;
  qualifiedDirectReferrals: number;
  leaderboardScore: number;
}



const TIER_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; min: number; max: number | null }
> = {
  none: { label: "—", color: "text-white/40", bg: "bg-white/5", min: 0, max: 0 },
  explorer: { label: "Explorer", color: "text-emerald-400", bg: "bg-emerald-500/10", min: 1, max: 10 },
  operator: { label: "Operator", color: "text-sky-400", bg: "bg-sky-500/10", min: 11, max: 50 },
  catalyst: { label: "Catalyst", color: "text-violet-400", bg: "bg-violet-500/10", min: 51, max: 150 },
  architect: { label: "Architect", color: "text-amber-400", bg: "bg-amber-500/10", min: 151, max: null },
};



const InboxRefer = () => {
  const { token, emailHash } = useAuth();
  const [referrals, setReferrals] = useState<ReferralsMeV2 | null>(null);
  const [network, setNetwork] = useState<NetworkResponse["network"] | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setLoadError(false);
      const backend = getBackendUrl();
      const headers = { Authorization: `Bearer ${token}` };
      const [refRes, netRes, lbRes] = await Promise.all([
        axios.get(`${backend}/referrals/me`, { headers }),
        axios.get(`${backend}/referrals/network`, { headers }),
        axios.get(`${backend}/leaderboard?limit=20`),
      ]);
      setReferrals(refRes.data);
      setNetwork(netRes.data?.network ?? null);
      setLeaderboard(lbRes.data?.leaderboard ?? []);
    } catch (e) {
      console.error("Failed to load referral data", e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const inviteUrl = useMemo(() => {
    if (!referrals?.referralCode) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/chat?ref=${referrals.referralCode}`;
  }, [referrals?.referralCode]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleClaim = async () => {
    if (!token || !referrals || referrals.claimableMuteBalance <= 0) return;
    setClaiming(true);
    toast("MUTE rewards are tracked in-app. On-chain claiming opens after payout launch.");
    setTimeout(() => setClaiming(false), 400);
  };

  const tier = referrals?.ambassadorTier ?? "none";
  const tierConfig = TIER_CONFIG[tier] ?? TIER_CONFIG.none;
  const myMaskedPrefix = emailHash ? emailHash.slice(0, 8).toLowerCase() : "";
  const isCurrentUserInTop20 = leaderboard.some(
    (entry) => myMaskedPrefix && entry.maskedUserHash.toLowerCase().startsWith(myMaskedPrefix)
  );

  const allNetworkReferrals = useMemo(() => {
    if (!network) return [];
    return [
      ...network.level1,
      ...network.level2,
      ...network.level3,
    ];
  }, [network]);

  return (
    <div className="container mt-[20px] md:py-[20px] relative">
      {}
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
        <h2 className="text-white font-sora text-[15px] md:text-[40px] lg:text-[64px]">
          Referrals
        </h2>
        <div className="max-w-[400px] text-[#9AA4C7]">
          <p className="text-[10px] mb-[20px] md:text-[12px] font-sora">
            Invite friends and earn MUTE tokens. Rewards unlock in stages as your
            referrals complete onboarding and become active — up to 3 levels deep.
          </p>
        </div>
      </div>

      <div className="max-w-[950px] w-full mx-auto flex flex-col gap-4">

        {}
        <div
          className="w-full rounded-2xl bg-cover bg-center"
          style={{ backgroundImage: `url(${rafflebg.src})` }}
        >
          <div className="p-[20px] flex flex-col gap-3">
            <h3 className="text-white text-[18px] sm:text-[24px] md:text-[32px] font-sora">
              Refer a friend
            </h3>
            <span className="block text-white/60 text-[12px] sm:text-[14px] font-sora">
              Direct referrals earn you{" "}
              <strong className="text-white">1,500 MUTE</strong> as they
              complete onboarding, activity, and verification — paid in 3 stages.
            </span>
            {loadError && (
              <div className="flex flex-col gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[11px] text-red-100/90 font-sora">
                  Unable to load referral data.
                </span>
                <button
                  type="button"
                  onClick={fetchData}
                  className="h-8 rounded-full border border-red-200/20 px-4 text-[10px] text-white transition hover:bg-white/10"
                >
                  Retry
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <div className="flex-1 bg-black/30 rounded-full px-4 h-[44px] flex items-center border border-white/10">
                <FiLink className="text-white/60 mr-2 flex-shrink-0" />
                <span className="text-white/80 text-[12px] truncate font-sora">
                  {loading ? <SkeletonLine className="h-3 w-[70%]" /> : inviteUrl || "No referral code yet"}
                </span>
              </div>
              <button
                onClick={handleCopy}
                disabled={!inviteUrl || loading}
                className="h-[44px] px-5 rounded-full bg-[#3730EA] text-white text-[12px] font-sora flex items-center justify-center gap-2 hover:bg-[#2f29c8] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? (
                  <><FiCheck size={14} /> Copied</>
                ) : (
                  <><FiCopy size={14} /> Copy Link</>
                )}
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {}
          <div className="bg-[#FFFFFF0D] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <FiCheckCircle size={16} />
              <span className="text-xs font-sora text-white/50">Approved MUTE</span>
            </div>
            <p className="text-white text-[28px] font-sora font-semibold">
              {loading ? <SkeletonCardValue /> : (referrals?.claimableMuteBalance ?? 0).toLocaleString()}
            </p>
            <button
              onClick={handleClaim}
              disabled={claiming || loading || (referrals?.claimableMuteBalance ?? 0) <= 0}
              className="mt-1 h-9 rounded-full bg-[#3730EA] text-white text-xs font-sora flex items-center justify-center hover:bg-[#2f29c8] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {claiming ? "Opening soon…" : "Payout pending launch"}
            </button>
          </div>

          {}
          <div className="bg-[#FFFFFF0D] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FiLock size={16} className="text-amber-400" />
              <span className="text-xs font-sora text-white/50">Locked MUTE</span>
            </div>
            <p className="text-white text-[28px] font-sora font-semibold">
              {loading ? <SkeletonCardValue /> : (referrals?.lockedMuteBalance ?? 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/30 font-sora">
              Unlocks as referrals complete stages
            </p>
          </div>

          {}
          <div className="bg-[#FFFFFF0D] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FiCheckCircle size={16} className="text-white/40" />
              <span className="text-xs font-sora text-white/50">Paid MUTE</span>
            </div>
            <p className="text-white text-[28px] font-sora font-semibold">
              {loading ? <SkeletonCardValue /> : (referrals?.paidMuteBalance ?? 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/30 font-sora">Total claimed to date</p>
          </div>
        </div>

        {}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex-1 border border-white/10 rounded-2xl p-4 flex items-center gap-3 ${tierConfig.bg}`}>
            <FiAward size={22} className={tierConfig.color} />
            <div>
              <p className="text-[10px] text-white/40 font-sora">Ambassador Tier</p>
              <p className={`text-[18px] font-sora font-semibold ${tierConfig.color}`}>
                {loading ? <SkeletonLine className="h-5 w-24" /> : tierConfig.label}
              </p>
              {tier !== "none" && (
                <p className="text-[10px] text-white/30 font-sora">
                  {TIER_CONFIG[tier].min}
                  {TIER_CONFIG[tier].max ? `–${TIER_CONFIG[tier].max}` : "+"} qualified direct refs
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 bg-[#FFFFFF0D] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <FiTrendingUp size={22} className="text-[#7B61FF]" />
            <div className="flex-1">
              <p className="text-[10px] text-white/40 font-sora">Leaderboard Rank</p>
              <p className="text-[18px] font-sora font-semibold text-white">
                {loading
                  ? <SkeletonLine className="h-5 w-14" />
                  : referrals?.leaderboardRank
                  ? `#${referrals.leaderboardRank}`
                  : "—"}
              </p>
              <p className="text-[10px] text-white/30 font-sora">
                Score: {loading ? <SkeletonLine className="inline-block h-3 w-10 align-middle" /> : (referrals?.leaderboardScore ?? 0)}
              </p>
              <button
                type="button"
                onClick={() => setLeaderboardOpen(true)}
                className="mt-2 h-8 rounded-full border border-white/10 px-4 text-[10px] font-sora text-white/80 transition hover:bg-white/10"
              >
                Open leaderboard
              </button>
            </div>
          </div>

          <div className="flex-1 bg-[#FFFFFF0D] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <FiUsers size={22} className="text-[#9AA4C7]" />
            <div>
              <p className="text-[10px] text-white/40 font-sora">Qualified Referrals</p>
              <p className="text-[18px] font-sora font-semibold text-white">
                {loading ? <SkeletonLine className="inline-block h-5 w-10 align-middle" /> : (referrals?.qualifiedDirectReferrals ?? 0)}
                <span className="text-[12px] text-white/30 ml-1">direct</span>
              </p>
              <p className="text-[10px] text-white/30 font-sora">
                {loading ? (
                  <SkeletonLine className="h-3 w-20" />
                ) : (
                  <>
                    L2: {referrals?.qualifiedLevel2Referrals ?? 0} &nbsp;·&nbsp; L3:{" "}
                    {referrals?.qualifiedLevel3Referrals ?? 0}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="bg-[#FFFFFF0D] border border-white/10 rounded-2xl p-4">
          <h4 className="text-white text-[14px] md:text-[16px] font-sora mb-3">
            How rewards work
          </h4>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "L1 Direct", mute: "1,500", breakdown: "500 + 500 + 500" },
              { label: "L2 Network", mute: "400", breakdown: "150 + 150 + 100" },
              { label: "L3 Network", mute: "100", breakdown: "25 + 25 + 50" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex flex-col items-center justify-center bg-white/5 rounded-xl px-3 py-3 border border-white/10 text-center"
              >
                <span className="text-white/50 text-[10px] font-sora">{row.label}</span>
                <span className="text-white text-[18px] font-sora font-bold mt-1">
                  {row.mute}
                </span>
                <span className="text-white/30 text-[9px] font-sora mt-0.5">MUTE</span>
                <span className="text-[#9AA4C7] text-[9px] font-sora mt-1">
                  {row.breakdown}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/30 font-sora">
            Stage 1: onboarding complete · Stage 2: active on 3 days · Stage 3: joined a group
            or started a chat + fraud check passed. Rewards subject to verification.
          </p>
        </div>

        {}
        {(loading || allNetworkReferrals.length > 0) && (
          <div className="bg-[#FFFFFF0D] border border-white/10 rounded-2xl p-4">
            <h4 className="text-white text-[14px] md:text-[16px] font-sora mb-3">
              Your referral network
            </h4>
            <div className="flex flex-col gap-2">
              {loading
                ? Array.from({ length: 3 }).map((_, idx) => <SkeletonRow key={idx} />)
                : allNetworkReferrals.map((ref, idx) => (
                    <ReferralRow key={`${ref.referralLevel}-${ref.maskedId}-${idx}`} ref={ref} />
                  ))}
            </div>
          </div>
        )}

        {}
        <div className="bg-[#FFFFFF0D] border border-white/10 rounded-2xl p-4">
          <h4 className="text-white text-[14px] md:text-[16px] font-sora mb-3">
            Ambassador tiers
          </h4>
          <div className="flex flex-col gap-1.5">
            {(["explorer", "operator", "catalyst", "architect"] as const).map((t) => {
              const cfg = TIER_CONFIG[t];
              const isActive = tier === t;
              return (
                <div
                  key={t}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border transition ${
                    isActive ? "border-[#3730EA] bg-[#3730EA]/10" : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FiAward size={14} className={cfg.color} />
                    <span className={`text-sm font-sora ${cfg.color}`}>{cfg.label}</span>
                    {isActive && (
                      <span className="text-[9px] px-2 py-[2px] rounded-full bg-[#3730EA] text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-white/40 text-[11px] font-sora">
                    {cfg.min}{cfg.max ? `–${cfg.max}` : "+"} qualified referrals
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {leaderboardOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="max-h-[86dvh] w-full max-w-[760px] overflow-hidden rounded-2xl border border-white/10 bg-[#090A14] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
                <div>
                  <h4 className="text-white text-[16px] md:text-[20px] font-sora">
                    Leaderboard
                  </h4>
                  <p className="mt-1 text-[10px] text-white/40 font-sora">
                    Top 20 users sorted by highest referral score.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLeaderboardOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10"
                  aria-label="Close leaderboard"
                >
                  <FiX />
                </button>
              </div>
              <div className="max-h-[68dvh] overflow-y-auto p-4 sm:p-5">
                <div className="grid grid-cols-[64px_1fr_130px_120px] gap-3 px-3 pb-2 text-[10px] uppercase tracking-[0.12em] text-white/35 max-sm:grid-cols-[52px_1fr_86px]">
                  <span>Rank</span>
                  <span>User</span>
                  <span className="max-sm:hidden">Ambassador</span>
                  <span className="text-right">Points</span>
                </div>
                <div className="flex flex-col gap-2">
                  {loading && leaderboard.length === 0
                    ? Array.from({ length: 8 }).map((_, idx) => <SkeletonRow key={idx} />)
                    : leaderboard.map((entry) => {
                    const entryTierCfg = TIER_CONFIG[entry.ambassadorTier] ?? TIER_CONFIG.none;
                    const isMe =
                      !!myMaskedPrefix &&
                      entry.maskedUserHash.toLowerCase().startsWith(myMaskedPrefix);
                    return (
                      <LeaderboardRow
                        key={entry.rank}
                        rank={entry.rank}
                        user={isMe ? "You" : entry.maskedUserHash}
                        tier={entryTierCfg.label}
                        tierClass={entryTierCfg.color}
                        points={entry.leaderboardScore}
                        highlight={isMe}
                      />
                    );
                  })}
                  {!isCurrentUserInTop20 && referrals?.leaderboardRank && (
                    <>
                      <div className="px-3 py-1 text-center text-[10px] text-white/25">...</div>
                      <LeaderboardRow
                        rank={referrals.leaderboardRank}
                        user="You"
                        tier={tierConfig.label}
                        tierClass={tierConfig.color}
                        points={referrals.leaderboardScore}
                        highlight
                      />
                    </>
                  )}
                  {leaderboard.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/45">
                      No leaderboard entries yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxRefer;



const StagePill = ({
  label,
  done,
}: {
  label: string;
  done: boolean;
}) => (
  <span
    className={`text-[9px] px-2 py-[2px] rounded-full font-sora border ${
      done
        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
        : "bg-white/5 border-white/10 text-white/30"
    }`}
  >
    {label}
  </span>
);

const LEVEL_LABELS: Record<1 | 2 | 3, string> = {
  1: "L1",
  2: "L2",
  3: "L3",
};
const LEVEL_COLORS: Record<1 | 2 | 3, string> = {
  1: "text-[#7B61FF]",
  2: "text-sky-400",
  3: "text-amber-400",
};

const SkeletonLine = ({ className = "h-3 w-24" }: { className?: string }) => (
  <span
    className={`block animate-pulse rounded-full bg-white/15 ${className}`}
    aria-hidden="true"
  />
);

const SkeletonCardValue = () => <SkeletonLine className="h-10 w-24" />;

const SkeletonRow = () => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <SkeletonLine className="h-4 w-10" />
      <SkeletonLine className="h-4 w-28" />
    </div>
    <div className="hidden flex-1 items-center gap-2 sm:flex">
      <SkeletonLine className="h-5 w-16" />
      <SkeletonLine className="h-5 w-16" />
      <SkeletonLine className="h-5 w-16" />
    </div>
    <SkeletonLine className="h-4 w-20" />
  </div>
);

const LeaderboardRow = ({
  rank,
  user,
  tier,
  tierClass,
  points,
  highlight,
}: {
  rank: number;
  user: string;
  tier: string;
  tierClass: string;
  points: number;
  highlight?: boolean;
}) => (
  <div
    className={`grid grid-cols-[64px_1fr_130px_120px] items-center gap-3 rounded-xl border px-3 py-3 text-sm max-sm:grid-cols-[52px_1fr_86px] ${
      highlight
        ? "border-[#3730EA] bg-[#3730EA]/15"
        : "border-white/10 bg-white/[0.04]"
    }`}
  >
    <span className="font-mono text-white/70">#{rank}</span>
    <div className="min-w-0">
      <span className="block truncate font-mono text-white/80">{user}</span>
      <span className={`hidden text-[10px] font-sora max-sm:block ${tierClass}`}>
        {tier}
      </span>
    </div>
    <span className={`text-[12px] font-sora max-sm:hidden ${tierClass}`}>{tier}</span>
    <span className="text-right font-sora text-white">
      {points.toLocaleString()}
    </span>
  </div>
);

const ReferralRow = ({ ref: entry }: { ref: NetworkReferral }) => (
  <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/10 bg-white/5 gap-3 flex-wrap">
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-mono font-bold ${LEVEL_COLORS[entry.referralLevel]}`}>
        {LEVEL_LABELS[entry.referralLevel]}
      </span>
      <span className="text-white/60 text-[11px] font-mono">{entry.maskedId}…</span>
    </div>
    <div className="flex items-center gap-1.5 flex-wrap">
      <StagePill label="Stage 1" done={entry.stage1Completed} />
      <StagePill label="Stage 2" done={entry.stage2Completed} />
      <StagePill label="Stage 3" done={entry.stage3Completed} />
    </div>
    <div className="text-right">
      {entry.claimableMute > 0 ? (
        <span className="text-emerald-400 text-[11px] font-sora">
          +{entry.claimableMute.toLocaleString()} MUTE ready
        </span>
      ) : entry.pendingMute > 0 ? (
        <span className="text-amber-400/70 text-[11px] font-sora">
          {entry.pendingMute.toLocaleString()} MUTE pending
        </span>
      ) : (
        <span className="text-white/20 text-[11px] font-sora">—</span>
      )}
    </div>
  </div>
);
