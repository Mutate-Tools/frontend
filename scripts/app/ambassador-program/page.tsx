"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  FiArrowRight, FiArrowUpRight, FiCheckCircle, FiShield,
  FiUsers, FiTrendingUp, FiZap, FiAward, FiTarget,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { IoRocketOutline } from "react-icons/io5";
import { PiNetworkBold } from "react-icons/pi";
import { TbHexagonLetterA, TbHexagonLetterB, TbHexagonLetterC, TbHexagonLetterD } from "react-icons/tb";
import logo from "@assets/logo.svg";
import btnbg from "@assets/btnbg.svg";

/* ═══════════════════════════════════════════════════════
   ANIMATION HELPERS
═══════════════════════════════════════════════════════ */

/** Animated counter that counts up when in view */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1400;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}{suffix}
    </span>
  );
}

/** Word-by-word animated heading */
function AnimatedHeading({
  text, className, delay = 0,
}: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const words = text.split(" ");
  return (
    <h2 ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.5, ease: "easeOut", delay: delay + i * 0.07 }}
        >
          {word}
        </motion.span>
      ))}
    </h2>
  );
}

/** Animated horizontal bar that fills on scroll */
function FillBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} className="h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1.1, ease: "easeOut", delay }}
      />
    </div>
  );
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7, ease: "easeOut" } },
};

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */

const referralLevels = [
  {
    level: "L1",
    label: "Direct Referral",
    total: 1500,
    displayTotal: "1,500",
    color: "#3730EA",
    border: "rgba(55,48,234,0.5)",
    glow: "rgba(55,48,234,0.4)",
    textColor: "#818cf8",
    desc: "You directly refer a user who becomes fully qualified through all five checks.",
    breakdowns: [
      { milestone: "Onboarding Complete", mute: "500" },
      { milestone: "7-Day Retention",     mute: "500" },
      { milestone: "Full Qualification",  mute: "500" },
    ],
    insight: "Your most powerful tier. Every qualified referral you make directly earns you 1,500 MUTE.",
  },
  {
    level: "L2",
    label: "Second-Degree",
    total: 400,
    displayTotal: "400",
    color: "#6366f1",
    border: "rgba(99,102,241,0.4)",
    glow: "rgba(99,102,241,0.3)",
    textColor: "#a5b4fc",
    desc: "A user referred by your direct referral becomes qualified. Your network works for you.",
    breakdowns: [
      { milestone: "Onboarding Complete", mute: "150" },
      { milestone: "7-Day Retention",     mute: "150" },
      { milestone: "Full Qualification",  mute: "100" },
    ],
    insight: "Passive rewards from your network. Each person your referrals bring in earns you 400 MUTE.",
  },
  {
    level: "L3",
    label: "Third-Degree",
    total: 100,
    displayTotal: "100",
    color: "#818cf8",
    border: "rgba(129,140,248,0.35)",
    glow: "rgba(129,140,248,0.2)",
    textColor: "#c7d2fe",
    desc: "A user referred by your second-level referral becomes qualified. Three generations deep.",
    breakdowns: [
      { milestone: "Onboarding Complete", mute: "25" },
      { milestone: "7-Day Retention",     mute: "25" },
      { milestone: "Full Qualification",  mute: "50" },
    ],
    insight: "Deep network rewards. As your community expands, L3 rewards compound at scale.",
  },
];

const ambassadorTiers = [
  {
    code: "T-01",
    name: "Explorer",
    range: "1 – 10",
    rangeMin: 1,
    rangeMax: 10,
    pct: 7,
    tagline: "The beginning of every great network.",
    desc: "You've started building. Your first qualified referrals confirm you understand the mission: bring real users who actually care about privacy and Web3-native communication.",
    color: "#6366f1",
    glowColor: "rgba(99,102,241,0.2)",
    borderColor: "rgba(99,102,241,0.35)",
    icon: <TbHexagonLetterA className="text-[28px]" />,
    minEarnings: "1,500",
    maxEarnings: "15,000",
    badge: "Starter",
  },
  {
    code: "T-02",
    name: "Operator",
    range: "11 – 50",
    rangeMin: 11,
    rangeMax: 50,
    pct: 33,
    tagline: "You operate with intent and consistency.",
    desc: "At Operator level, you've demonstrated that you can sustain qualified growth. Your referral network is real, active, and growing. You understand that quality beats volume.",
    color: "#3730EA",
    glowColor: "rgba(55,48,234,0.25)",
    borderColor: "rgba(55,48,234,0.4)",
    icon: <TbHexagonLetterB className="text-[28px]" />,
    minEarnings: "16,500",
    maxEarnings: "75,000",
    badge: "Active",
  },
  {
    code: "T-03",
    name: "Catalyst",
    range: "51 – 150",
    rangeMin: 51,
    rangeMax: 150,
    pct: 66,
    tagline: "Your network creates its own momentum.",
    desc: "Catalysts don't just refer — they ignite communities. At this tier, your impact on Mutate's growth is measurable and significant. L2 and L3 rewards begin compounding meaningfully.",
    color: "#4f46e5",
    glowColor: "rgba(79,70,229,0.3)",
    borderColor: "rgba(79,70,229,0.45)",
    icon: <TbHexagonLetterC className="text-[28px]" />,
    minEarnings: "76,500",
    maxEarnings: "225,000",
    badge: "Elite",
  },
  {
    code: "T-04",
    name: "Architect",
    range: "151+",
    rangeMin: 151,
    rangeMax: null,
    pct: 100,
    tagline: "You don't join networks. You build them.",
    desc: "Architects are the foundational builders of the Mutate ecosystem. At 151+ qualified referrals, you have proven that the Mutate mission resonates across real communities at scale.",
    color: "#818cf8",
    glowColor: "rgba(129,140,248,0.35)",
    borderColor: "rgba(129,140,248,0.5)",
    icon: <TbHexagonLetterD className="text-[28px]" />,
    minEarnings: "226,500",
    maxEarnings: "∞",
    badge: "Legend",
  },
];

const checks = [
  { num: "01", title: "Creates an account",                                         category: "Onboarding", icon: <FiUsers /> },
  { num: "02", title: "Creates at least one Subprofile",                            category: "Identity",   icon: <FiShield /> },
  { num: "03", title: "Joins a group or initiates a direct communication",          category: "Activation", icon: <FiZap /> },
  { num: "04", title: "Active on at least three separate calendar days",            category: "Retention",  icon: <FiTrendingUp /> },
  { num: "05", title: "Passes anti-fraud and anti-duplicate screening",             category: "Integrity",  icon: <FiCheckCircle /> },
];

const playbook = [
  { num: "01", icon: <FiTarget />,     title: "Target the right users",    desc: "Invite users who genuinely care about privacy, community, and Web3-native tools. Ambassadors who invite genuinely interested users produce higher qualification rates and therefore higher cumulative rewards." },
  { num: "02", icon: <FiZap />,        title: "Drive activation",           desc: "Guide new users into real groups or conversations so they become active quickly. Activation requires meaningful platform engagement." },
  { num: "03", icon: <FiShield />,     title: "Reduce setup friction",      desc: "Help new users complete setup and create their first Subprofile. Ambassadors who guide new users through Subprofile creation remove the most common friction point." },
  { num: "04", icon: <FiUsers />,      title: "Support retention",          desc: "Stay engaged with referrals during their first week so they reach the retention milestone. Ambassadors who maintain contact substantially increase qualification likelihood." },
];

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function AmbassadorPage() {
  return (
    <div className="min-h-screen bg-[#0a0910] text-white overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 backdrop-blur-lg bg-black/30 border-b border-white/[0.06]">
        <div className="container flex items-center justify-between py-3 md:py-4">
          <Link href="/"><Image src={logo} alt="Mutate Tools" priority /></Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-white/60 hover:text-white transition font-spaceGrotesk hidden sm:block">
              ← Home
            </Link>
            <div className="bg-white/10 border border-white/20 p-[4px] rounded-full">
              <Link href="/chat">
                <button className="relative flex items-center gap-2 rounded-full px-5 py-2 overflow-hidden">
                  <Image src={btnbg} alt="" fill className="object-cover rounded-full" />
                  <span className="relative z-10 text-white text-sm font-spaceGrotesk">Launch App</span>
                  <FiArrowUpRight className="relative z-10 text-white" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-28 overflow-hidden">
        {/* animated grid */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* hero glow */}
        <motion.div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] -z-10 rounded-full blur-[130px]"
          style={{ background: "radial-gradient(ellipse,rgba(55,48,234,0.45) 0%,transparent 70%)" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.45, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mb-6 border border-white/10 bg-white/[0.04] px-4 py-2 rounded-full">
              <HiSparkles className="text-[#3730EA]" />
              Referral + Ambassador Program
            </span>
          </motion.div>

          {/* animated word reveal for hero heading */}
          <div className="font-spaceGrotesk text-[42px] sm:text-[58px] lg:text-[76px] leading-[1.05] text-[#EAF0FF] max-w-4xl mx-auto">
            {["Bring", "real", "users."].map((word, i) => (
              <motion.span key={word + i} className="inline-block mr-[0.3em]"
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 + i * 0.1 }}>
                {word}
              </motion.span>
            ))}
            <br />
            {["Earn", "$MUTE", "as the", "network", "grows."].map((word, i) => (
              <motion.span key={word + i}
                className="inline-block mr-[0.3em]"
                style={{ color: i < 2 ? "#3730EA" : undefined }}
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 + i * 0.1 }}>
                {word}
              </motion.span>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-7 font-spaceGrotesk text-[16px] md:text-[18px] text-[#9AA4C7] max-w-2xl mx-auto leading-7"
          >
            The Mutate Ambassador Program distributes $MUTE token rewards to users who grow the
            network by bringing real, active participants into the ecosystem. Rewards are earned for
            genuine network growth — not raw sign-up volume.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.05 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/chat" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#3730EA] px-7 font-spaceGrotesk text-sm text-white transition hover:bg-[#4338CA]">
              Start Referring <FiArrowRight />
            </Link>
            <Link href="/whitepaper" target="_blank" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-7 font-spaceGrotesk text-sm text-white/70 transition hover:bg-white/10">
              Read Whitepaper <FiArrowUpRight />
            </Link>
          </motion.div>

          {/* stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-16 grid grid-cols-3 max-w-lg mx-auto divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
          >
            {[
              { target: 40, suffix: "M", label: "MUTE Reserved" },
              { target: 3, suffix: "",  label: "Referral Levels" },
              { target: 4, suffix: "",  label: "Ambassador Tiers" },
            ].map((s) => (
              <div key={s.label} className="py-6 px-4 text-center">
                <p className="font-spaceGrotesk text-[28px] font-bold text-white">
                  <AnimatedNumber target={s.target} suffix={s.suffix} />
                </p>
                <p className="font-spaceGrotesk text-[10px] uppercase tracking-[0.18em] text-[#9AA4C7] mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          REFERRAL LEVELS — deep detail
      ══════════════════════════════════════════════════════ */}
      <section className="container pb-32">

        {/* section header */}
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <motion.p variants={fadeUp} className="font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mb-3">
            // Three-Level Referral Structure
          </motion.p>
          <AnimatedHeading
            text="Every qualified referral pays across three generations."
            className="font-spaceGrotesk text-[28px] md:text-[42px] text-[#EAF0FF] max-w-2xl leading-tight"
          />
          <motion.p variants={fadeUp} className="font-spaceGrotesk text-[15px] text-[#9AA4C7] mt-4 max-w-xl leading-6">
            Rewards are disbursed across three milestones per referral. The chain reaches three
            levels deep — your direct referrals, their referrals, and their referrals' referrals.
          </motion.p>
        </motion.div>

        {/* three level cards — detailed */}
        <div className="mt-12 flex flex-col gap-6">
          {referralLevels.map((lv, i) => (
            <motion.div
              key={lv.level}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.1 }}
              className="relative rounded-[24px] border bg-[#080912] overflow-hidden"
              style={{ borderColor: lv.border }}
            >
              {/* corner glow */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full blur-[80px]" style={{ background: lv.glow }} />

              <div className="relative z-10 grid md:grid-cols-[1fr_1.4fr] gap-0">
                {/* left — reward hero */}
                <div className="p-7 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/[0.07]">
                  <div>
                    <span className="inline-flex items-center gap-2 text-[11px] font-spaceGrotesk uppercase tracking-[0.22em] px-3 py-1.5 rounded-full border mb-6"
                      style={{ borderColor: lv.border, color: lv.textColor, background: lv.color + "18" }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: lv.color }} />
                      {lv.level} · {lv.label}
                    </span>
                    <div className="font-spaceGrotesk font-bold leading-none" style={{ color: lv.textColor }}>
                      <span className="text-[72px] md:text-[88px]">
                        <AnimatedNumber target={lv.total} />
                      </span>
                    </div>
                    <p className="font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mt-1">
                      MUTE per qualified referral
                    </p>
                  </div>
                  <p className="font-spaceGrotesk text-[13px] text-white/50 mt-6 leading-5 max-w-xs">
                    {lv.desc}
                  </p>
                </div>

                {/* right — breakdown + insight */}
                <div className="p-7 md:p-10 flex flex-col justify-between">
                  <div>
                    <p className="font-spaceGrotesk text-[11px] uppercase tracking-[0.2em] text-[#9AA4C7] mb-5">
                      Milestone Breakdown
                    </p>
                    <div className="flex flex-col gap-3">
                      {lv.breakdowns.map((b, bi) => (
                        <motion.div
                          key={b.milestone}
                          initial={{ opacity: 0, x: 16 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: i * 0.1 + bi * 0.1 }}
                          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                              style={{ background: lv.color + "40", border: `1px solid ${lv.border}` }}>
                              {bi + 1}
                            </div>
                            <span className="font-spaceGrotesk text-[13px] text-white/60">{b.milestone}</span>
                          </div>
                          <span className="font-spaceGrotesk text-[15px] font-bold" style={{ color: lv.textColor }}>
                            +{b.mute}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* insight callout */}
                  <div className="mt-6 rounded-xl p-4 border" style={{ borderColor: lv.border, background: lv.color + "0d" }}>
                    <div className="flex items-start gap-3">
                      <HiSparkles className="flex-shrink-0 mt-0.5" style={{ color: lv.textColor }} />
                      <p className="font-spaceGrotesk text-[12px] leading-5" style={{ color: lv.textColor }}>
                        {lv.insight}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* referral chain flow */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="mt-8 rounded-[20px] border border-white/10 bg-[#080912] p-6 md:p-8"
        >
          <p className="font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mb-7">
            Chain example — You → Ali → Sara → Omar
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
            {[
              { name: "YOU",  role: "Referrer",       note: "You start the chain", earn: null },
              { name: "ALI",  role: "Direct (L1)",    note: "Ali qualifies",        earn: { mute: "1,500", level: "L1" } },
              { name: "SARA", role: "L2 via Ali",     note: "Sara qualifies",       earn: { mute: "400",   level: "L2" } },
              { name: "OMAR", role: "L3 via Sara",    note: "Omar qualifies",       earn: { mute: "100",   level: "L3" } },
            ].map((node, i, arr) => (
              <React.Fragment key={node.name}>
                <motion.div
                  className="flex-1 flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                >
                  <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-spaceGrotesk font-black text-lg mb-3"
                    style={{ borderColor: i === 0 ? "rgba(255,255,255,0.2)" : "#3730EA", background: i === 0 ? "rgba(255,255,255,0.05)" : "rgba(55,48,234,0.2)", color: i === 0 ? "rgba(255,255,255,0.5)" : "#818cf8" }}>
                    {node.name.slice(0, 1)}
                  </div>
                  <p className="font-spaceGrotesk font-bold text-[14px] text-white">{node.name}</p>
                  <p className="font-spaceGrotesk text-[11px] text-white/40 mt-0.5">{node.role}</p>
                  <p className="font-spaceGrotesk text-[10px] text-white/25 mt-1">{node.note}</p>
                  {node.earn && (
                    <motion.div
                      className="mt-3 flex flex-col items-center gap-1"
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.12 + 0.3 }}
                    >
                      <span className="text-[10px] font-spaceGrotesk text-white/30 uppercase tracking-wider">you earn</span>
                      <span className="bg-[#3730EA]/25 border border-[#3730EA]/50 text-[#818cf8] text-[12px] font-bold px-3 py-1 rounded-full">
                        +{node.earn.mute} MUTE
                      </span>
                      <span className="text-[9px] font-spaceGrotesk uppercase tracking-wider" style={{ color: "#6366f1" }}>
                        {node.earn.level} reward
                      </span>
                    </motion.div>
                  )}
                </motion.div>
                {i < arr.length - 1 && (
                  <div className="hidden sm:flex items-start pt-5 flex-shrink-0">
                    <motion.div
                      className="flex items-center"
                      initial={{ opacity: 0, scaleX: 0 }}
                      whileInView={{ opacity: 1, scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.12 + 0.2, transformOrigin: "left" }}
                    >
                      <div className="w-8 h-px bg-white/20" />
                      <div className="w-0 h-0" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "7px solid rgba(255,255,255,0.2)" }} />
                    </motion.div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* total earned callout */}
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#3730EA]/30 bg-[#3730EA]/10 px-5 py-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div>
              <p className="font-spaceGrotesk text-[11px] uppercase tracking-[0.2em] text-[#9AA4C7]">Total earned from this chain</p>
              <p className="font-spaceGrotesk text-[28px] font-bold text-white mt-1">
                2,000 <span className="text-[#818cf8] text-[16px] font-normal">MUTE</span>
              </p>
            </div>
            <div className="flex gap-3 text-[12px] font-spaceGrotesk">
              {[{ label: "Ali qualifies", val: "+1,500" }, { label: "Sara qualifies", val: "+400" }, { label: "Omar qualifies", val: "+100" }].map((e) => (
                <div key={e.label} className="text-center">
                  <p className="text-[#818cf8] font-bold">{e.val}</p>
                  <p className="text-white/30 text-[10px] mt-0.5">{e.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          AMBASSADOR TIERS — immersive redesign
      ══════════════════════════════════════════════════════ */}
      <section className="pb-32 relative overflow-hidden">
        {/* section bg glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] blur-[160px] opacity-[0.12]"
          style={{ background: "radial-gradient(ellipse,#3730EA,transparent 70%)" }} />

        <div className="container relative z-10">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
            <motion.p variants={fadeUp} className="font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mb-3">
              // Ambassador Tiers — Status &amp; Progression
            </motion.p>
            <AnimatedHeading
              text="Four tiers. One trajectory."
              className="font-spaceGrotesk text-[28px] md:text-[42px] text-[#EAF0FF] leading-tight"
              delay={0.05}
            />
            <motion.p variants={fadeUp} className="font-spaceGrotesk text-[15px] text-[#9AA4C7] mt-4 max-w-xl leading-6">
              Your tier is determined by the number of qualified direct referrals you bring into
              the network. Tiers are status designations — they recognize your contribution and
              reflect your position within the Ambassador community.
            </motion.p>
          </motion.div>

          {/* tier progression track */}
          <div className="mt-14 relative">
            {/* vertical connector line on desktop */}
            <div className="hidden lg:block absolute left-[26px] top-8 bottom-8 w-px bg-gradient-to-b from-[#3730EA]/60 via-[#6366f1]/40 to-[#818cf8]/20" />

            <div className="flex flex-col gap-5">
              {ambassadorTiers.map((tier, i) => (
                <motion.div
                  key={tier.code}
                  initial={{ opacity: 0, x: -32 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.12 }}
                  className="relative lg:pl-16"
                >
                  {/* timeline dot */}
                  <div
                    className="hidden lg:flex absolute left-0 top-8 w-[52px] h-[52px] rounded-full items-center justify-center border-2 z-10"
                    style={{ borderColor: tier.borderColor, background: tier.color + "25", color: tier.color }}
                  >
                    {tier.icon}
                  </div>

                  {/* card */}
                  <div
                    className="rounded-[24px] border bg-[#080912] overflow-hidden"
                    style={{ borderColor: tier.borderColor }}
                  >
                    {/* top glow bar */}
                    <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${tier.color}, transparent)` }} />

                    <div className="grid lg:grid-cols-[1fr_1.6fr] gap-0">
                      {/* left — identity */}
                      <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/[0.07] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center border lg:hidden"
                              style={{ borderColor: tier.borderColor, background: tier.color + "25", color: tier.color }}>
                              {tier.icon}
                            </div>
                            <span className="font-spaceGrotesk text-[11px] uppercase tracking-[0.22em] text-[#9AA4C7]">
                              {tier.code}
                            </span>
                          </div>
                          <p className="font-spaceGrotesk text-[32px] md:text-[40px] font-bold text-[#EAF0FF] leading-none">
                            {tier.name}
                          </p>
                          <p className="font-spaceGrotesk text-[13px] mt-2 leading-5" style={{ color: tier.color }}>
                            {tier.tagline}
                          </p>
                        </div>

                        {/* referral range */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-spaceGrotesk text-[11px] text-white/40 uppercase tracking-wider">Qualified Referrals</span>
                            <span className="font-spaceGrotesk text-[13px] font-bold" style={{ color: tier.color }}>{tier.range}</span>
                          </div>
                          <FillBar pct={tier.pct} color={tier.color} delay={i * 0.12 + 0.3} />

                          {/* badge */}
                          <div className="mt-4 inline-flex items-center gap-2">
                            <span className="text-xs font-spaceGrotesk uppercase tracking-[0.18em] px-3 py-1 rounded-full border font-semibold"
                              style={{ borderColor: tier.borderColor, color: tier.color, background: tier.color + "18" }}>
                              {tier.badge}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* right — description + earnings */}
                      <div className="p-6 lg:p-8 flex flex-col justify-between">
                        <div>
                          <p className="font-spaceGrotesk text-[11px] uppercase tracking-[0.2em] text-[#9AA4C7] mb-3">
                            What this tier means
                          </p>
                          <p className="font-spaceGrotesk text-[14px] text-white/65 leading-6">
                            {tier.desc}
                          </p>
                        </div>

                        {/* earnings range */}
                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                            <p className="font-spaceGrotesk text-[10px] uppercase tracking-[0.18em] text-[#9AA4C7] mb-1">
                              Min L1 Earnings
                            </p>
                            <p className="font-spaceGrotesk text-[20px] font-bold" style={{ color: tier.color }}>
                              {tier.minEarnings}
                            </p>
                            <p className="font-spaceGrotesk text-[10px] text-[#9AA4C7]">MUTE</p>
                          </div>
                          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                            <p className="font-spaceGrotesk text-[10px] uppercase tracking-[0.18em] text-[#9AA4C7] mb-1">
                              {tier.rangeMax ? "Max L1 Earnings" : "L1 Earnings so far"}
                            </p>
                            <p className="font-spaceGrotesk text-[20px] font-bold" style={{ color: tier.color }}>
                              {tier.maxEarnings}
                            </p>
                            <p className="font-spaceGrotesk text-[10px] text-[#9AA4C7]">
                              {tier.rangeMax ? "MUTE" : "MUTE and growing"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* tier progression summary bar */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="mt-8 rounded-[20px] border border-white/10 bg-[#080912] p-6 md:p-8"
          >
            <p className="font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mb-6">
              Tier Progression Overview
            </p>
            <div className="flex flex-col gap-4">
              {ambassadorTiers.map((tier, i) => (
                <motion.div
                  key={tier.code}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="w-24 shrink-0 flex items-center gap-2">
                    <span className="font-spaceGrotesk text-[10px] uppercase tracking-wider text-[#9AA4C7]">{tier.code}</span>
                    <span className="font-spaceGrotesk text-[13px] font-semibold" style={{ color: tier.color }}>{tier.name}</span>
                  </div>
                  <div className="flex-1">
                    <FillBar pct={tier.pct} color={tier.color} delay={0.3 + i * 0.1} />
                  </div>
                  <span className="font-spaceGrotesk text-[11px] text-white/40 shrink-0 w-16 text-right">{tier.range}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MILESTONE DISBURSEMENT
      ══════════════════════════════════════════════════════ */}
      <section className="container pb-28">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <motion.p variants={fadeUp} className="font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mb-3">
            // Milestone-Based Reward Disbursement
          </motion.p>
          <AnimatedHeading
            text="Rewards unlock in three stages."
            className="font-spaceGrotesk text-[28px] md:text-[38px] text-[#EAF0FF] max-w-xl leading-tight"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-8 rounded-[20px] border border-white/10 bg-[#080912] overflow-hidden"
        >
          <div className="grid grid-cols-4 border-b border-white/10 bg-white/[0.03]">
            {["Milestone", "L1 Reward", "L2 Reward", "L3 Reward"].map((h) => (
              <div key={h} className="px-4 sm:px-6 py-4 font-spaceGrotesk text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#9AA4C7]">{h}</div>
            ))}
          </div>
          {[
            { label: "Onboarding Complete", l1: "500", l2: "150", l3: "25" },
            { label: "7-Day Retention",     l1: "500", l2: "150", l3: "25" },
            { label: "Full Qualification",  l1: "500", l2: "100", l3: "50" },
          ].map((m, i) => (
            <motion.div key={m.label}
              className={`grid grid-cols-4 border-b border-white/[0.05] ${i % 2 === 1 ? "bg-white/[0.02]" : ""}`}
              initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}>
              <div className="px-4 sm:px-6 py-4 font-spaceGrotesk text-[12px] sm:text-[13px] text-white/60">{m.label}</div>
              {[{ v: m.l1, c: "#818cf8" }, { v: m.l2, c: "#a5b4fc" }, { v: m.l3, c: "#c7d2fe" }].map(({ v, c }) => (
                <div key={v + c} className="px-4 sm:px-6 py-4">
                  <span className="font-spaceGrotesk text-[14px] sm:text-[15px] font-semibold" style={{ color: c }}>{v}</span>
                  <span className="font-spaceGrotesk text-[10px] text-[#9AA4C7] ml-1">MUTE</span>
                </div>
              ))}
            </motion.div>
          ))}
          <div className="grid grid-cols-4 bg-[#3730EA]/10 border-t border-[#3730EA]/30">
            <div className="px-4 sm:px-6 py-4 font-spaceGrotesk text-[12px] sm:text-[13px] font-bold text-[#EAF0FF]">Total Per User</div>
            {[{ v: "1,500", c: "#818cf8" }, { v: "400", c: "#a5b4fc" }, { v: "100", c: "#c7d2fe" }].map(({ v, c }) => (
              <div key={v} className="px-4 sm:px-6 py-4">
                <span className="font-spaceGrotesk text-[16px] sm:text-[18px] font-bold" style={{ color: c }}>{v}</span>
                <span className="font-spaceGrotesk text-[10px] text-[#9AA4C7] ml-1">MUTE</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          QUALIFICATION CHECKS
      ══════════════════════════════════════════════════════ */}
      <section className="container pb-28">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <motion.p variants={fadeUp} className="font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mb-3">
            // Qualification Requirements
          </motion.p>
          <AnimatedHeading
            text="Five checks to qualify a referral."
            className="font-spaceGrotesk text-[28px] md:text-[38px] text-[#EAF0FF] max-w-xl leading-tight"
          />
          <motion.p variants={fadeUp} className="font-spaceGrotesk text-[15px] text-[#9AA4C7] mt-4 max-w-lg leading-6">
            A sign-up that does not result in an active, engaged user contributes no value to the
            network and generates no reward.
          </motion.p>
        </motion.div>

        <div className="mt-8 flex flex-col gap-3">
          {checks.map((c, i) => (
            <motion.div key={c.num}
              initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.55, delay: i * 0.08 }}
              className="group flex items-start gap-5 rounded-[16px] border border-white/10 bg-[#080912] px-5 py-4 hover:border-[#3730EA]/50 hover:bg-[#3730EA]/[0.04] transition-all duration-300 cursor-default"
            >
              <div className="w-9 h-9 rounded-full bg-[#3730EA]/20 border border-[#3730EA]/40 flex items-center justify-center text-[#818cf8] font-spaceGrotesk font-bold text-[12px] flex-shrink-0 group-hover:bg-[#3730EA]/35 transition-colors">
                {c.num}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-spaceGrotesk text-[14px] text-[#EAF0FF]">{c.title}</p>
                <p className="font-spaceGrotesk text-[11px] uppercase tracking-[0.16em] text-[#9AA4C7]/60 mt-0.5">{c.category}</p>
              </div>
              <div className="text-[#9AA4C7]/30 flex-shrink-0 mt-0.5 group-hover:text-[#3730EA]/60 transition-colors">{c.icon}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          AMBASSADOR PLAYBOOK
      ══════════════════════════════════════════════════════ */}
      <section className="container pb-28">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <motion.p variants={fadeUp} className="font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mb-3">
            // Ambassador Playbook
          </motion.p>
          <AnimatedHeading
            text="Four strategies that maximize rewards."
            className="font-spaceGrotesk text-[28px] md:text-[38px] text-[#EAF0FF] max-w-xl leading-tight"
          />
        </motion.div>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {playbook.map((item, i) => (
            <motion.div key={item.num}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group rounded-[20px] border border-white/10 bg-[#080912] p-6 hover:border-[#3730EA]/40 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#3730EA]/20 border border-[#3730EA]/40 flex items-center justify-center text-[#818cf8] group-hover:bg-[#3730EA]/35 transition-colors">
                  {item.icon}
                </div>
                <span className="font-spaceGrotesk text-[11px] uppercase tracking-[0.2em] text-[#9AA4C7]">{item.num}</span>
              </div>
              <p className="font-spaceGrotesk text-[17px] font-semibold text-[#EAF0FF] mb-3">{item.title}</p>
              <p className="font-spaceGrotesk text-[13px] text-[#9AA4C7] leading-6">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ANTI-ABUSE
      ══════════════════════════════════════════════════════ */}
      <section className="container pb-28">
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7 }}
          className="rounded-[20px] border border-white/10 bg-[#080912] p-7 md:p-10"
        >
          <p className="font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mb-3">// Anti-Abuse Policy</p>
          <h2 className="font-spaceGrotesk text-[22px] md:text-[28px] text-[#EAF0FF] mb-7 leading-tight">Program integrity is actively enforced.</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: "Delay, Reduction, or Cancellation", desc: "Reward payments may be delayed, reduced, or canceled where duplicate accounts or suspicious behavioral patterns are detected." },
              { title: "Disqualification",                  desc: "Raw sign-ups, fake or automated activity, and self-referral loop structures do not qualify under any circumstances." },
              { title: "Adaptive Logic",                    desc: "Mutate reserves the right to update qualification logic and detection thresholds in response to emerging abuse patterns." },
            ].map((item, i) => (
              <motion.div key={item.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3730EA] flex-shrink-0" />
                  <p className="font-spaceGrotesk text-[13px] font-semibold text-[#EAF0FF]">{item.title}</p>
                </div>
                <p className="font-spaceGrotesk text-[12px] text-[#9AA4C7] leading-5 pl-3.5">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TOTAL ALLOCATION CTA
      ══════════════════════════════════════════════════════ */}
      <section className="container pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8 }}
          className="relative rounded-[28px] overflow-hidden border border-[#3730EA]/30"
          style={{ background: "linear-gradient(135deg,#08072a 0%,#0e0d3a 60%,#15124a 100%)" }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
          <motion.div
            className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-30"
            style={{ background: "#3730EA" }}
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 5, repeat: Infinity }} />

          <div className="relative z-10 p-8 md:p-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
            >
              <p className="font-spaceGrotesk text-[12px] uppercase tracking-[0.22em] text-[#9AA4C7] mb-6">// Total Program Allocation</p>
              <p className="font-spaceGrotesk font-bold text-white leading-none">
                <span className="text-[72px] md:text-[108px]">
                  <AnimatedNumber target={40} suffix="M" />
                </span>
                <span className="text-[#3730EA] text-[72px] md:text-[108px]"></span>
              </p>
              <p className="font-spaceGrotesk text-[18px] md:text-[22px] text-[#9AA4C7] mt-3">
                MUTE tokens reserved for ambassador rewards
              </p>
              <p className="font-spaceGrotesk text-[14px] text-white/35 mt-3 max-w-md mx-auto leading-6">
                4% of total $MUTE supply. This allocation is finite and will not be expanded through monetary issuance.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href="/chat" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#3730EA] px-7 font-spaceGrotesk text-sm text-white transition hover:bg-[#4338CA]">
                  Start Referring <FiArrowRight />
                </Link>
                <Link href="/whitepaper" target="_blank" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-7 font-spaceGrotesk text-sm text-white/70 transition hover:bg-white/10">
                  Full Whitepaper <FiArrowUpRight />
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/"><Image src={logo} alt="Mutate Tools" /></Link>
          <p className="font-spaceGrotesk text-[13px] text-white/30">Built to mutate. Designed to disappear.</p>
          <Link href="/" className="font-spaceGrotesk text-[13px] text-white/40 hover:text-white transition">← Back to Home</Link>
        </div>
      </footer>

    </div>
  );
}
