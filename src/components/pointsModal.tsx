"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiRefreshCw, FiX } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { getBackendUrl } from "@/src/utils/backend-url";

type ActivityRow = {
  kind: string;
  earned: number;
  cap: number;
  baseAmount: number;
};

type PointEvent = {
  _id: string;
  kind: string;
  amount: number;
  day: string;
  createdAt: string;
};

const labels: Record<string, string> = {
  daily_login: "Daily login",
  profile_complete: "Complete profile",
  profile_image: "Add profile image",
  first_dm: "First DM sent",
  group_join: "Join group/chatroom",
  room_create: "Create room",
  valid_conversation: "Valid conversation",
  chat: "Legacy chat points",
  referral_bonus: "Referral bonus",
  referral_signup: "Referral signup",
};

const rules = [
  ["Daily login", "5 MP", "5/day"],
  ["Complete profile", "25 MP", "Once"],
  ["Add profile image", "10 MP", "Once"],
  ["First DM sent", "10 MP", "Once"],
  ["Join group/chatroom", "10 MP", "30/day"],
  ["Create room", "25 MP", "50/day"],
  ["Valid conversation", "15 MP", "100/day"],
];

export default function PointsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token, profile, refreshProfile } = useAuth();
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [events, setEvents] = useState<PointEvent[]>([]);
  const [total, setTotal] = useState(profile?.chatPoints || 0);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const backend = getBackendUrl();
      const [pointsRes, historyRes] = await Promise.all([
        axios.get(`${backend}/points/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${backend}/points/history?limit=20`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setTotal(pointsRes.data?.chatPoints || 0);
      setActivity(pointsRes.data?.todayActivity || []);
      setDisabled(!!pointsRes.data?.mpEarningDisabled);
      setEvents(historyRes.data?.events || []);
      refreshProfile().catch(() => {});
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Unable to load points");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open, token]);

  const activityByKind = useMemo(() => new Map(activity.map((row) => [row.kind, row])), [activity]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0d1020] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#9AA4C7]">Mutate Points</p>
            <h2 className="mt-1 text-2xl font-semibold">{total.toLocaleString()} MP</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 disabled:opacity-50"
              aria-label="Refresh points"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5"
              aria-label="Close points"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(88vh-90px)] overflow-y-auto p-4">
          {disabled && (
            <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
              MP earning is currently disabled for this account.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9AA4C7]">Today</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {rules.map(([name]) => {
                const kind = Object.entries(labels).find(([, label]) => label === name)?.[0] || "";
                const row = activityByKind.get(kind);
                const earned = row?.earned || 0;
                const cap = row?.cap || 0;
                const pct = cap > 0 ? Math.min(100, (earned / cap) * 100) : 0;
                return (
                  <div key={name} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>{name}</span>
                      <span className="text-[#9AA4C7]">{earned}/{cap} MP</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#3730EA]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9AA4C7]">Reward rules</h3>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                {rules.map(([name, base, cap]) => (
                  <div key={name} className="grid grid-cols-[1fr_80px_80px] border-b border-white/10 px-3 py-2 text-sm last:border-b-0">
                    <span>{name}</span>
                    <span className="text-[#9AA4C7]">{base}</span>
                    <span className="text-right text-[#9AA4C7]">{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9AA4C7]">Recent history</h3>
              <div className="mt-3 grid gap-2">
                {loading && events.length === 0 ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="h-12 animate-pulse rounded-xl bg-white/10" />
                  ))
                ) : events.length ? (
                  events.map((event) => (
                    <div key={event._id} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
                      <div>
                        <p>{labels[event.kind] || event.kind}</p>
                        <p className="text-xs text-[#6f7aa3]">{new Date(event.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="font-semibold text-emerald-300">+{event.amount}</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-white/[0.04] p-3 text-sm text-[#9AA4C7]">No point history yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
