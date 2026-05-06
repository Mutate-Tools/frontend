"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiRefreshCw,
  FiShield,
  FiCheck,
  FiX,
  FiRotateCcw,
  FiUsers,
  FiAward,
  FiAlertTriangle,
} from "react-icons/fi";

const getBackendUrl = () => {
  if (typeof window === "undefined") return "http://localhost:8080";
  return (
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8080`
  );
};

type AdminUser = {
  emailHash: string;
  fraudScore?: number;
  ambassadorTier?: string;
  qualificationStatus?: string;
  lockedMuteBalance?: number;
  claimableMuteBalance?: number;
  paidMuteBalance?: number;
  totalReferrals?: number;
  createdAt?: string;
};

type Reward = {
  _id: string;
  beneficiaryHash: string;
  sourceUserHash: string;
  rewardType: string;
  referralLevel: 1 | 2 | 3;
  amountMute: number;
  stage: string;
  status: string;
  reasonCode?: string | null;
  createdAt?: string;
};

type Chain = {
  _id: string;
  referredUserHash: string;
  level1Hash: string;
  level2Hash?: string | null;
  level3Hash?: string | null;
  qualification?: {
    stage1Completed?: boolean;
    stage2Completed?: boolean;
    stage3Completed?: boolean;
    fullyQualified?: boolean;
  } | null;
  riskSummary?: {
    total: number;
    sameDevice: number;
    sameIp: number;
    open: number;
  };
};

type RiskCluster = {
  _id: string;
  referredUserHash: string;
  level1Hash?: string | null;
  level2Hash?: string | null;
  level3Hash?: string | null;
  matchedUserHash: string;
  matchedLevel: 1 | 2 | 3;
  riskType: "same_device" | "same_ip";
  evidencePreview?: string | null;
  reviewStatus: "open" | "reviewed" | "ignored" | "confirmed";
  firstSeenAt?: string;
  lastSeenAt?: string;
};

type Reserve = {
  totalMute: number;
  allocatedMute: number;
  claimableMute: number;
  paidMute: number;
  exhaustionAlertSent?: boolean;
};

const shortHash = (hash?: string | null) => (hash ? `${hash.slice(0, 10)}...` : "-");
const fmt = (n?: number) => Number(n || 0).toLocaleString();

export default function ReferralAdminPage() {
  const [secret, setSecret] = useState("");
  const [savedSecret, setSavedSecret] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [riskClusters, setRiskClusters] = useState<RiskCluster[]>([]);
  const [reserve, setReserve] = useState<Reserve | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem("admin_referral_secret") || "";
    setSecret(existing);
    setSavedSecret(existing);
  }, []);

  const headers = useMemo(
    () => (savedSecret ? { "X-Admin-Secret": savedSecret } : {}),
    [savedSecret]
  );

  const fetchAdminData = useCallback(async () => {
    if (!savedSecret) return;
    setLoading(true);
    try {
      const backend = getBackendUrl();
      const [usersRes, rewardsRes, chainsRes, reserveRes, riskRes] = await Promise.all([
        axios.get(`${backend}/admin/referrals/users?limit=100`, { headers }),
        axios.get(`${backend}/admin/referrals/rewards?limit=100`, { headers }),
        axios.get(`${backend}/admin/referrals/chains?limit=100`, { headers }),
        axios.get(`${backend}/admin/referrals/reserve`, { headers }),
        axios.get(`${backend}/admin/referrals/risk-clusters?limit=100`, { headers }),
      ]);
      setUsers(usersRes.data?.users || []);
      setRewards(rewardsRes.data?.rewards || []);
      setChains(chainsRes.data?.chains || []);
      setReserve(reserveRes.data || null);
      setRiskClusters(riskRes.data?.clusters || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.response?.data?.error || "Admin load failed");
    } finally {
      setLoading(false);
    }
  }, [headers, savedSecret]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const saveSecret = () => {
    localStorage.setItem("admin_referral_secret", secret.trim());
    setSavedSecret(secret.trim());
    toast.success("Admin secret saved locally");
  };

  const postAction = async (url: string, body: Record<string, any> = {}) => {
    const backend = getBackendUrl();
    await axios.post(`${backend}${url}`, body, { headers });
    await fetchAdminData();
  };

  const approveReward = async (rewardId: string) => {
    await postAction(`/admin/referrals/reward/${rewardId}/approve`);
    toast.success("Reward approved");
  };

  const rejectReward = async (rewardId: string) => {
    const reasonCode = window.prompt("Reason code", "admin_rejected") || "admin_rejected";
    await postAction(`/admin/referrals/reward/${rewardId}/reject`, { reasonCode });
    toast.success("Reward rejected");
  };

  const reverseReward = async (rewardId: string) => {
    const reasonCode = window.prompt("Reason code", "admin_reversed") || "admin_reversed";
    await postAction(`/admin/referrals/reward/${rewardId}/reverse`, { reasonCode });
    toast.success("Reward reversed");
  };

  const setFraudScore = async (hash: string) => {
    const raw = window.prompt("Fraud score 0-100", "0");
    if (raw === null) return;
    const score = Math.min(Math.max(Number(raw) || 0, 0), 100);
    const backend = getBackendUrl();
    await axios.patch(`${backend}/admin/referrals/user/${hash}/fraud-score`, { score }, { headers });
    await fetchAdminData();
    toast.success("Fraud score updated");
  };

  const flagUser = async (hash: string) => {
    await postAction(`/admin/referrals/user/${hash}/flag`);
    toast.success("User flagged");
  };

  const unflagUser = async (hash: string) => {
    await postAction(`/admin/referrals/user/${hash}/unflag`);
    toast.success("User unflagged");
  };

  const setTier = async (hash: string) => {
    const tier = window.prompt(
      "Tier: none, explorer, operator, catalyst, architect",
      "none"
    );
    if (!tier) return;
    await postAction(`/admin/referrals/user/${hash}/ambassador-tier`, { tier });
    toast.success("Ambassador tier updated");
  };

  const backfillLegacy = async () => {
    await postAction("/admin/referrals/backfill");
    toast.success("Legacy referrals backfilled");
  };

  const setRiskStatus = async (id: string, currentStatus: string) => {
    const reviewStatus = window.prompt(
      "Status: open, reviewed, ignored, confirmed",
      currentStatus
    );
    if (!reviewStatus) return;
    const backend = getBackendUrl();
    await axios.patch(`${backend}/admin/referrals/risk-clusters/${id}/status`, { reviewStatus }, { headers });
    await fetchAdminData();
    toast.success("Risk status updated");
  };

  return (
    <main className="min-h-screen bg-[#05050B] px-4 py-8 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9AA4C7]">Mutate Admin</p>
            <h1 className="mt-2 text-3xl font-semibold">Referral Rewards</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Review MUTE rewards, reserve usage, qualification chains, fraud scores, and ambassador tiers.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin secret"
              type="password"
              className="h-11 rounded-full border border-white/10 bg-black/30 px-4 text-sm outline-none"
            />
            <button onClick={saveSecret} className="h-11 rounded-full bg-[#3730EA] px-5 text-sm">
              Save Secret
            </button>
            <button
              onClick={fetchAdminData}
              disabled={!savedSecret || loading}
              className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 px-5 text-sm disabled:opacity-40"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </header>

        {reserve && (
          <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <Metric label="Reserve" value={fmt(reserve.totalMute)} />
            <Metric label="Allocated" value={fmt(reserve.allocatedMute)} />
            <Metric label="Claimable" value={fmt(reserve.claimableMute)} />
            <Metric label="Paid" value={fmt(reserve.paidMute)} />
            <Metric
              label="Remaining"
              value={fmt(Math.max(0, reserve.totalMute - reserve.allocatedMute))}
              tone={reserve.exhaustionAlertSent ? "warn" : "normal"}
            />
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FiUsers /> Users
            </h2>
            <button onClick={backfillLegacy} className="rounded-full border border-white/10 px-4 py-2 text-xs">
              Backfill legacy referrals
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="text-xs text-white/40">
                <tr>
                  <th className="py-2">User</th>
                  <th>Fraud</th>
                  <th>Qualification</th>
                  <th>Tier</th>
                  <th>Locked</th>
                  <th>Claimable</th>
                  <th>Paid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.emailHash} className="border-t border-white/5">
                    <td className="py-3 font-mono text-xs">{shortHash(user.emailHash)}</td>
                    <td>{user.fraudScore ?? 0}</td>
                    <td>{user.qualificationStatus || "not_started"}</td>
                    <td>{user.ambassadorTier || "none"}</td>
                    <td>{fmt(user.lockedMuteBalance)}</td>
                    <td>{fmt(user.claimableMuteBalance)}</td>
                    <td>{fmt(user.paidMuteBalance)}</td>
                    <td className="flex gap-2 py-2">
                      <button onClick={() => setFraudScore(user.emailHash)} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                        Fraud
                      </button>
                      <button onClick={() => flagUser(user.emailHash)} className="rounded-full border border-amber-400/20 px-3 py-1 text-xs text-amber-200">
                        Flag
                      </button>
                      <button onClick={() => unflagUser(user.emailHash)} className="rounded-full border border-emerald-400/20 px-3 py-1 text-xs text-emerald-200">
                        Clear
                      </button>
                      <button onClick={() => setTier(user.emailHash)} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                        Tier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FiAward /> Rewards
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="text-xs text-white/40">
                <tr>
                  <th className="py-2">Beneficiary</th>
                  <th>Source</th>
                  <th>Level</th>
                  <th>Stage</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward) => (
                  <tr key={reward._id} className="border-t border-white/5">
                    <td className="py-3 font-mono text-xs">{shortHash(reward.beneficiaryHash)}</td>
                    <td className="font-mono text-xs">{shortHash(reward.sourceUserHash)}</td>
                    <td>L{reward.referralLevel}</td>
                    <td>{reward.stage}</td>
                    <td>{fmt(reward.amountMute)} MUTE</td>
                    <td>{reward.status}</td>
                    <td>{reward.reasonCode || "-"}</td>
                    <td className="flex gap-2 py-2">
                      <IconButton label="Approve" onClick={() => approveReward(reward._id)} icon={<FiCheck />} />
                      <IconButton label="Reject" onClick={() => rejectReward(reward._id)} icon={<FiX />} />
                      <IconButton label="Reverse" onClick={() => reverseReward(reward._id)} icon={<FiRotateCcw />} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FiShield /> Referral Chains
          </h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {chains.map((chain) => (
              <div key={chain._id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="font-mono text-xs text-white/70">Referred: {shortHash(chain.referredUserHash)}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-white/50">
                  <span>L1 {shortHash(chain.level1Hash)}</span>
                  <span>L2 {shortHash(chain.level2Hash)}</span>
                  <span>L3 {shortHash(chain.level3Hash)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Stage label="Stage 1" done={!!chain.qualification?.stage1Completed} />
                  <Stage label="Stage 2" done={!!chain.qualification?.stage2Completed} />
                  <Stage label="Stage 3" done={!!chain.qualification?.stage3Completed} />
                  <Stage label="Qualified" done={!!chain.qualification?.fullyQualified} />
                  {!!chain.riskSummary?.total && (
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-200">
                      Risk {chain.riskSummary.total} ({chain.riskSummary.sameDevice} device / {chain.riskSummary.sameIp} IP)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FiAlertTriangle /> Referral Risk Clusters
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="text-xs text-white/40">
                <tr>
                  <th className="py-2">Referred</th>
                  <th>Matched</th>
                  <th>Level</th>
                  <th>Type</th>
                  <th>Evidence</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {riskClusters.map((cluster) => (
                  <tr key={cluster._id} className="border-t border-white/5">
                    <td className="py-3 font-mono text-xs">{shortHash(cluster.referredUserHash)}</td>
                    <td className="font-mono text-xs">{shortHash(cluster.matchedUserHash)}</td>
                    <td>L{cluster.matchedLevel}</td>
                    <td>{cluster.riskType === "same_device" ? "Same device" : "Same IP"}</td>
                    <td>{cluster.evidencePreview || "hashed device"}</td>
                    <td>{cluster.reviewStatus}</td>
                    <td>{cluster.lastSeenAt ? new Date(cluster.lastSeenAt).toLocaleString() : "-"}</td>
                    <td className="py-2">
                      <button onClick={() => setRiskStatus(cluster._id, cluster.reviewStatus)} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                        Status
                      </button>
                    </td>
                  </tr>
                ))}
                {riskClusters.length === 0 && (
                  <tr>
                    <td colSpan={8} className="border-t border-white/5 py-6 text-center text-white/40">
                      No referral risk clusters recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

const Metric = ({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "warn" }) => (
  <div className={`rounded-2xl border p-4 ${tone === "warn" ? "border-amber-400/40 bg-amber-500/10" : "border-white/10 bg-white/[0.04]"}`}>
    <p className="text-xs text-white/40">{label}</p>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
  </div>
);

const Stage = ({ label, done }: { label: string; done: boolean }) => (
  <span className={`rounded-full px-3 py-1 ${done ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/30"}`}>
    {label}
  </span>
);

const IconButton = ({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    title={label}
    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/70 hover:bg-white/10"
  >
    {icon}
  </button>
);
