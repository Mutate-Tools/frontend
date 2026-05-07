"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const allocations = [
  {
    label: "Liquidity",
    short: "Liquidity",
    percent: 79,
    tokens: "790,000,000",
    color: "#3730EA",
    glow: "rgba(55,48,234,0.55)",
    desc: "Deep on-chain liquidity pool",
  },
  {
    label: "Community Airdrop & Activity Mining",
    short: "Community",
    percent: 5,
    tokens: "50,000,000",
    color: "#7C8CFF",
    glow: "rgba(124,140,255,0.45)",
    desc: "Airdrop + activity-based mining",
  },
  {
    label: "Referral Reserve",
    short: "Referral",
    percent: 4,
    tokens: "40,000,000",
    color: "#7CF0FF",
    glow: "rgba(124,240,255,0.45)",
    desc: "Ambassador & referral rewards",
  },
  {
    label: "KOL / Partnerships",
    short: "KOL",
    percent: 4,
    tokens: "40,000,000",
    color: "#22D3EE",
    glow: "rgba(34,211,238,0.45)",
    desc: "Key opinion leaders & growth",
  },
  {
    label: "Team",
    short: "Team",
    percent: 3,
    tokens: "30,000,000",
    color: "#A78BFA",
    glow: "rgba(167,139,250,0.45)",
    desc: "Core contributors & founders",
  },
  {
    label: "Treasury",
    short: "Treasury",
    percent: 3,
    tokens: "30,000,000",
    color: "#FB923C",
    glow: "rgba(251,146,60,0.45)",
    desc: "Protocol reserves & ops",
  },
  {
    label: "Node Operators",
    short: "Nodes",
    percent: 2,
    tokens: "20,000,000",
    color: "#34D399",
    glow: "rgba(52,211,153,0.45)",
    desc: "Relay & infrastructure incentives",
  },
] as const;

// ─── Donut geometry ──────────────────────────────────────────────────────────

const RADIUS = 90;
const STROKE = 22;
const CX = 130;
const CY = 130;
const CIRC = 2 * Math.PI * RADIUS; // ≈ 565.49
const GAP = 2.5;

const segments = (() => {
  const totalArc = CIRC - allocations.length * GAP;
  let cum = 0;
  return allocations.map((a) => {
    const dash = (a.percent / 100) * totalArc;
    const seg = { ...a, dash, offset: cum };
    cum += dash + GAP;
    return seg;
  });
})();

// ─── Donut chart ─────────────────────────────────────────────────────────────

function DonutChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="relative flex shrink-0 items-center justify-center"
    >
      <svg
        width="260"
        height="260"
        viewBox="0 0 260 260"
        aria-hidden="true"
        className="overflow-visible"
      >
        {/* Glow backdrop */}
        <defs>
          <radialGradient id="donut-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3730EA" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#3730EA" stopOpacity="0" />
          </radialGradient>
          <filter id="seg-blur">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft background glow */}
        <circle cx={CX} cy={CY} r={RADIUS + 30} fill="url(#donut-glow)" />

        {/* Track ring */}
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={STROKE}
        />

        {/* Segments */}
        <g transform={`rotate(-90 ${CX} ${CY})`}>
          {segments.map((seg, i) => (
            <motion.circle
              key={seg.label}
              cx={CX}
              cy={CY}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="butt"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.45, delay: i * 0.07 + 0.1 }}
              style={{ filter: `drop-shadow(0 0 7px ${seg.glow})` }}
            />
          ))}
        </g>

        {/* Inner ring highlight */}
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS - STROKE / 2 - 1}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />
      </svg>

      {/* Center content */}
      <motion.div
        className="absolute flex flex-col items-center text-center"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.55, delay: 0.55, ease: "easeOut" }}
      >
        <p className="font-mono text-[8.5px] uppercase tracking-[0.30em] text-white/35">
          Total Supply
        </p>
        <p className="mt-0.5 font-spaceGrotesk text-[50px] font-semibold leading-none text-white">
          1B
        </p>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.28em] text-[#7C8CFF]">
          MUTE
        </p>
        <div className="my-2 h-px w-8 bg-white/10" />
        <p className="font-mono text-[8px] uppercase tracking-[0.20em] text-white/25">
          Fixed · No Inflation
        </p>
      </motion.div>
    </div>
  );
}

// ─── Allocation list ──────────────────────────────────────────────────────────

function AllocationList() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="flex flex-col gap-2">
      {segments.map((seg, i) => (
        <motion.div
          key={seg.label}
          initial={{ opacity: 0, x: 28 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: i * 0.055, ease: "easeOut" }}
          className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.05]"
        >
          {/* Left accent stripe */}
          <div
            className="absolute inset-y-0 left-0 w-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ background: seg.color }}
          />

          <div className="flex items-center gap-3 pl-1">
            {/* Color dot */}
            <span
              className="h-2 w-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{
                background: seg.color,
                boxShadow: `0 0 8px ${seg.glow}`,
              }}
            />

            {/* Label + desc */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-spaceGrotesk text-[13px] font-medium leading-tight text-white/75 group-hover:text-white/90">
                {seg.label}
              </p>
              <p className="font-mono text-[9.5px] tracking-[0.10em] text-white/25">
                {seg.desc}
              </p>
            </div>

            {/* Percentage */}
            <span
              className="shrink-0 font-spaceGrotesk text-[22px] font-semibold leading-none tabular-nums"
              style={{ color: seg.color }}
            >
              {seg.percent}%
            </span>
          </div>

          {/* Bar + token count */}
          <div className="mt-2.5 flex items-center gap-3 pl-1">
            <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${seg.color}60, ${seg.color})`,
                }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${seg.percent}%` } : { width: 0 }}
                transition={{
                  duration: 0.85,
                  delay: i * 0.055 + 0.2,
                  ease: "easeOut",
                }}
              />
            </div>
            <span className="shrink-0 font-mono text-[9.5px] tracking-[0.10em] text-white/28">
              {seg.tokens} MUTE
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Distribution bar ─────────────────────────────────────────────────────────

function DistributionBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="mt-12 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-5"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-white/30">
          Full Distribution
        </p>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.20em] text-white/18">
          1,000,000,000 MUTE
        </p>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.04]">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.label}
            className="h-full"
            style={{ backgroundColor: seg.color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${seg.percent}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/38">
              {seg.short}
            </span>
            <span className="font-mono text-[9px] text-white/20">
              {seg.percent}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Stats row ────────────────────────────────────────────────────────────────

const stats = [
  {
    label: "Total Supply",
    value: "1,000,000,000",
    unit: "MUTE",
    note: "Hard cap · no new minting",
  },
  {
    label: "Liquidity Pool",
    value: "79%",
    unit: "Allocated",
    note: "Largest single allocation",
  },
  {
    label: "Community",
    value: "11%",
    unit: "Reserved",
    note: "Airdrop + Referral + KOL",
  },
  {
    label: "Operations",
    value: "8%",
    unit: "Controlled",
    note: "Team + Treasury + Nodes",
  },
];

function StatsRow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.07 + 0.2 }}
          className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-4"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/35">
            {s.label}
          </p>
          <p className="mt-2 font-spaceGrotesk text-[22px] font-semibold leading-none text-white sm:text-[26px]">
            {s.value}
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#7C8CFF]">
            {s.unit}
          </p>
          <p className="mt-2 font-mono text-[9px] leading-4 tracking-[0.10em] text-white/25">
            {s.note}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function Tokenomics() {
  return (
    <section
      id="tokenomics"
      className="relative overflow-hidden py-20 lg:py-28"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.032]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(124,140,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,140,255,1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Left glow (behind chart) */}
        <div className="absolute left-[-5%] top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(55,48,234,0.12)_0%,transparent_70%)] blur-3xl" />
        {/* Right glow */}
        <div className="absolute right-[5%] top-[20%] h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(124,240,255,0.055)_0%,transparent_70%)] blur-3xl" />
        {/* Horizontal separator lines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      <div className="container relative z-10 px-4">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mb-14"
        >
          {/* Eyebrow */}
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-[#7C8CFF]/50" />
            <p className="font-mono text-[10.5px] uppercase tracking-[0.36em] text-[#7C8CFF]">
              Tokenomics
            </p>
          </div>

          <h2 className="max-w-[680px] font-spaceGrotesk text-[36px] font-semibold leading-[1.1] text-[#EAF0FF] md:text-[52px]">
            Built for{" "}
            <span className="bg-gradient-to-r from-[#7C8CFF] to-[#3730EA] bg-clip-text text-transparent">
              deep liquidity
            </span>
            .<br />
            Designed for{" "}
            <span className="bg-gradient-to-r from-[#7CF0FF] to-[#22D3EE] bg-clip-text text-transparent">
              long-term growth
            </span>
            .
          </h2>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <p className="max-w-[560px] text-[15px] leading-7 text-[#9AA4C7]">
              Total supply is fixed at 1,000,000,000 MUTE — no inflation, no new
              minting. Heavily weighted toward liquidity, with defined reserves
              for community, operations, and relay infrastructure.
            </p>
            {/* Fixed supply chip */}
            <span className="inline-flex items-center gap-2 rounded-full border border-[#7C8CFF]/25 bg-[#7C8CFF]/8 px-4 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.24em] text-[#7C8CFF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7CFFB2] shadow-[0_0_8px_#7CFFB2] animate-pulse" />
              Fixed Supply · No Inflation
            </span>
          </div>
        </motion.div>

        {/* ── Divider ── */}
        <div className="mb-10 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

        {/* ── Main grid: chart + list ── */}
        <div className="grid items-center gap-10 lg:grid-cols-[auto_1fr] lg:gap-14">
          <DonutChart />
          <AllocationList />
        </div>

        {/* ── Distribution bar + legend ── */}
        <DistributionBar />

        {/* ── Stats row ── */}
        <StatsRow />
      </div>
    </section>
  );
}
