"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { BsDot } from "react-icons/bs";
import { motion, useInView } from "framer-motion";
import roadmap from "@assets/raodmapimg.svg";



const phases = [
  {
    title: "Phase 1",
    heading: "Privacy Research & Core Modules (Completed)",
    items: [
      "Privacy-first vision defined. Established Mutate’s core philosophy around eliminating static digital identities rather than simply encrypting data.",
      "Surveillance threat analysis. Studied how modern tracking works through metadata, identity correlation, and network behavior.",
      "Core privacy modules developed. Built foundational components for identity mutation, key rotation, and secure message handling.",
    ],
  },
  {
    title: "Phase 2",
    heading: "UI & Ecosystem Design (In Progress)",
    items: [
      "Ecosystem-wide UI design. Designing the interface for Mutate messaging and future privacy tools.",
      "Privacy without complexity. Ensuring users benefit from advanced privacy without technical overhead.",
      "Minimal and intuitive experience. Creating a clean, modern interface where privacy works silently in the background.",
    ],
  },
  {
    title: "Phase 3",
    heading: "Backend & Infrastructure Integration",
    items: [
      "UI-to-protocol connection. Connecting the interface with identity mutation, encryption, and routing layers.",
      "Secure communication flows. Defining how messages are created, routed, encrypted, and destroyed.",
      "Decentralized scalability. Preparing infrastructure to scale without introducing centralized points of failure.",
    ],
  },
  {
    title: "Phase 4",
    heading: "Community Beta Release",
    items: [
      "Public beta launch. Releasing Mutate.tools to early community users.",
      "Real-world usage testing. Allowing users to test messaging performance, privacy behavior, and reliability.",
      "Feedback-driven refinement. Iterating based on user feedback to improve stability and usability.",
    ],
  },
  {
    title: "Phase 5",
    heading: "Points System & Community Rewards",
    items: [
      "Usage-based incentives Introducing a point system that rewards active messaging and participation.",
      "Early adopter alignment Incentivizing feedback, testing, and ecosystem engagement.",
      "Airdrop preparation Points earned will later convert into token allocations at TGE.",
    ],
  },
  {
    title: "Phase 6",
    heading: "Mutate Presale & Token Generation Event (TGE)",
    items: [
      "Token launch preparation Finalizing token mechanics and distribution structure.",
      "Presale execution Conducting a presale for early supporters and aligned participants.",
      "TGE launch Official token generation event (chain to be decided).",
      "Community airdrop distribution Converting earned points into token allocations for early users.",
      "Ecosystem activation Enabling token-based participation within the Mutate ecosystem.",
    ],
  },
  {
    title: "Phase 7",
    heading: "Decentralized Node-Based VPN",
    items: [
      "Node-powered VPN development Building a fully decentralized VPN supported by community-run nodes.",
      "No centralized traffic logging Eliminating reliance on traditional VPN providers.",
      "Privacy beyond messaging Extending Mutate’s moving-target privacy model to general internet usage.",
    ],
  },
  {
    title: "Phase 8",
    heading: "Governance & Oversight",
    items: [
      "Board-led supervision All development governed by a dedicated oversight board.",
      "Protocol integrity and security Ensuring privacy guarantees remain uncompromised.",
      "Sustainable ecosystem growth Guiding Mutate’s expansion responsibly and transparently",
    ],
  },
  {
    title: "Phase 9",
    heading: "Long-Term Vision",
    items: [
      "A full privacy ecosystem Expanding Mutate beyond messaging into a comprehensive privacy platform.",
      "Continuous evolution Adapting as surveillance methods and threats evolve.",
      "Digital autonomy by design Empowering users with tools that leave no permanent digital footprint.",
    ],
  },
];



interface PhaseCardProps {
  phase: any;
  idx: number;
  activePhase: number;
  setActivePhase: React.Dispatch<React.SetStateAction<number>>;
}

const PhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  idx,
  activePhase,
  setActivePhase,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      setActivePhase(idx);
    }
  }, [isInView, idx, setActivePhase]);

  return (
    <motion.div
      ref={ref}
      className={`border p-6 rounded-xl relative transition-all duration-500
        ${
          activePhase === idx
            ? "border-[#6C63FF] bg-[#1C1A3A] shadow-lg"
            : "border-[#FFFFFF1A] bg-transparent"
        }
      `}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
    >

      <div className="absolute -top-2 -left-2 h-3 w-3 rounded-full bg-white" />
      <div className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-white" />
      <div className="absolute -bottom-2 -left-2 h-3 w-3 rounded-full bg-white" />
      <div className="absolute -bottom-2 -right-2 h-3 w-3 rounded-full bg-white" />

      <span className="text-[#9AA4C7] text-[20px] font-spaceGrotesk">
        {phase.title}
      </span>

      <h2 className="text-[#EAF0FF] lg:text-[32px] text-[18px] md:text-[20px] max-md:leading-[20px] mt-2 font-spaceGrotesk">
        {phase.heading}
      </h2>

      <div className="mt-4 space-y-3">
        {phase.items.map((item: string, i: number) => (
          <div key={i} className="flex gap-2 items-start">
            <BsDot
              className={`mt-[5px] ${
                activePhase === idx ? "text-[#6C63FF]" : "text-white"
              }`}
            />
            <p className="text-[#EAF0FF] lg:text-[16px] max-md:leading-[18px] text-[13px] font-spaceGrotesk">
              {item}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};



const Roadmap: React.FC = () => {
  const [activePhase, setActivePhase] = useState<number>(0);

  return (
    <div
      id="roadmap"
      className="flex flex-col-reverse lg:flex-row gap-8 relative min-h-screen container mx-auto mt-8"
    >

      <div className="flex-1 space-y-12">
        {phases.map((phase, idx) => (
          <PhaseCard
            key={idx}
            phase={phase}
            idx={idx}
            activePhase={activePhase}
            setActivePhase={setActivePhase}
          />
        ))}
      </div>


      <div className="flex-1 w-full sticky top-28 self-start">
        <Image src={roadmap} alt="roadmap" className="w-full rounded-xl" />
      </div>
    </div>
  );
};

export default Roadmap;
