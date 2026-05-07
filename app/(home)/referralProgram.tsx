"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiAward, FiUsers, FiTrendingUp } from "react-icons/fi";

const rewards = [
  { label: "Level 1", value: "1,500", detail: "Direct qualified referrals" },
  { label: "Level 2", value: "400", detail: "Network qualified referrals" },
  { label: "Level 3", value: "100", detail: "Extended network referrals" },
];

const tiers = ["Explorer", "Operator", "Catalyst", "Architect"];

const ReferralProgram = () => {
  return (
    <section className="container mx-auto mt-16 px-4 py-10">
      <motion.div
        className="overflow-hidden rounded-[24px] border border-white/10 bg-[#080912]"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="font-spaceGrotesk text-[14px] uppercase tracking-[0.22em] text-[#9AA4C7]">
              Referral + Ambassador Program
            </p>
            <h2 className="mt-4 max-w-[780px] font-spaceGrotesk text-[32px] leading-tight text-[#EAF0FF] md:text-[52px]">
              Earn MUTE by bringing real users into private messaging.
            </h2>
            <p className="mt-5 max-w-[640px] font-spaceGrotesk text-[15px] leading-7 text-[#9AA4C7] md:text-[18px]">
              Rewards unlock as referred users complete onboarding, become active, and pass verification.
              Ambassador tiers recognize users who bring qualified communities into Mutate.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#3730EA] px-6 font-spaceGrotesk text-sm text-white transition hover:bg-[#4338CA]"
              >
                Open dapp <FiArrowRight />
              </Link>
              <Link
                href="/ambassador-program"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-6 font-spaceGrotesk text-sm text-white/80 transition hover:bg-white/10"
              >
                Ambassador Program <FiArrowRight />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {rewards.map((reward) => (
                <div key={reward.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-spaceGrotesk text-[11px] text-white/45">{reward.label}</p>
                  <p className="mt-2 font-spaceGrotesk text-[24px] font-semibold text-white md:text-[32px]">
                    {reward.value}
                  </p>
                  <p className="font-spaceGrotesk text-[10px] uppercase tracking-[0.18em] text-[#9AA4C7]">
                    MUTE
                  </p>
                  <p className="mt-3 font-spaceGrotesk text-[11px] leading-4 text-white/45">
                    {reward.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-3 text-white">
                <FiAward className="text-[#9AA4C7]" />
                <span className="font-spaceGrotesk text-sm">Ambassador tiers</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {tiers.map((tier) => (
                  <span key={tier} className="rounded-full border border-white/10 px-4 py-2 font-spaceGrotesk text-xs text-white/70">
                    {tier}
                  </span>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-[#9AA4C7]">
                <div className="flex items-center gap-2">
                  <FiUsers /> Qualified referrals
                </div>
                <div className="flex items-center gap-2">
                  <FiTrendingUp /> Leaderboard score
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ReferralProgram;
