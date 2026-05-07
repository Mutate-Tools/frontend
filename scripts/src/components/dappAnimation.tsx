"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import chatlogo from "@assets/chatlogo.svg";

const BasePath = ({ d }: { d: string }) => (
  <path d={d} fill="none" stroke="#3730EA" strokeWidth="1" opacity="0.15" />
);

const AnimatedPath = ({
  d,
  gradientId,
  duration,
  delay,
}: {
  d: string;
  gradientId: string;
  duration: number;
  delay?: number;
}) => (
  <motion.path
    d={d}
    fill="none"
    stroke={`url(#${gradientId})`}
    strokeWidth="2.5"
    strokeLinecap="round"
    animate={{ strokeDashoffset: [0, -1440] }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "linear",
      delay: delay || 0,
    }}
  />
);

const LineGroup = ({ type }: { type: "top" | "bottom" }) => {
  const gradientId = type === "top" ? "flowGradientTop" : "flowGradientBottom";

  return (
    <svg
      className={`absolute left-0 w-full ${
        type === "top" ? "top-[20%]" : "top-[60%]"
      }`}
      height="160"
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
    >
      <defs>
        <motion.linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={type === "top" ? "-1440" : "0"}
          y1="0"
          x2={type === "top" ? "0" : "1440"}
          y2="0"
          animate={{
            x1: type === "top" ? [-1440, 1440] : [0, -1440],
            x2: type === "top" ? [0, 2880] : [1440, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <stop offset="0%" stopColor="transparent" />
          <stop offset="45%" stopColor="#3730EA" />
          <stop offset="55%" stopColor="#3730EA" />
          <stop offset="100%" stopColor="transparent" />
        </motion.linearGradient>
      </defs>

      {Array.from({ length: 6 }).map((_, i) => {
        const offset = i * 8;
        const delay = i * 0.08;

        const dTop = `M0 ${65 + offset} Q720 ${130 + offset} 1440 ${65 + offset}`;
        const dBottom = `M0 ${95 - offset} Q720 ${30 - offset} 1440 ${95 - offset}`;

        return (
          <g key={i}>
            <BasePath d={type === "top" ? dTop : dBottom} />
            <AnimatedPath
              d={type === "top" ? dTop : dBottom}
              gradientId={gradientId}
              duration={2.6 - i * 0.15}
              delay={delay}
            />
          </g>
        );
      })}
    </svg>
  );
};

const DappAnimation = () => {
  return (
    <div className="relative h-[300px] w-full overflow-hidden">
      <LineGroup type="top" />


      <div className="absolute  pt-[70px] inset-0 flex items-center justify-center z-10">
        <Image
          src={chatlogo}
          alt="Chat Logo"
          width={120}
          height={120}
          className="object-contain"
          priority
        />
      </div>

      <LineGroup type="bottom" />
    </div>
  );
};

export default DappAnimation;
