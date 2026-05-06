"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import faqsBulb from "@assets/faqsbulb.svg";
import Started from "./started";

const faqsData = [
  {
    question: "What is Mutate.tools?",
    answer:
      "Mutate.tools is a decentralized messaging and privacy ecosystem designed to prevent tracking by removing static digital identities. Your identity, keys, and network paths continuously change while you communicate.",
  },
  {
    question: "How is Mutate different from encrypted messaging apps?",
    answer:
      "Most apps encrypt messages but keep identities and metadata static. Mutate goes further by making identities disposable and routes unpredictable, protecting both message content and communication patterns.",
  },
  {
    question: "Is Mutate difficult to use?",
    answer:
      "No. Mutate is designed to feel simple and familiar. All privacy features operate automatically in the background without requiring technical knowledge.",
  },
  {
    question: " Does Mutate store my messages or data?",
    answer:
      "Mutate avoids permanent data storage. Messages are encrypted, keys rotate constantly, and deleted messages are permanently removed, leaving no recoverable traces.",
  },
  {
    question: "Will Mutate have a token?",
    answer:
      "Yes. Mutate plans to introduce MUTE. Referral rewards unlock through qualified onboarding, real activity, and verification, with in-app balances shown before payout launch.",
  },
  {
    question: "How do referral rewards work?",
    answer:
      "Users can earn up to 1,500 MUTE from direct qualified referrals, plus network rewards across two additional levels. Rewards unlock in stages as referrals complete onboarding and become active.",
  },
];

const Faqs = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <motion.div
      id="faqs"
      className="md:h-[2000px] h-[130vh] relative bg-no-repea bg-DoubleBg bg-center bg-cover overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
    >

      <div className="absolute top-0 left-0 w-full z-0">
        <Image src={faqsBulb} alt="bulb" className="w-full h-auto" />
      </div>

      <div className="container md:pt-[200px] pt-[10px] relative z-10">
        <h2 className="text-center text-[#EAF0FF] font-spaceGrotesk lg:text-[60px] text-[20px] md:text-[30px] leading-tight mb-[20px] md:mb-16">
          Frequently <span className="block">Asked Questions</span>
        </h2>

        <div className="max-w-[800px] mx-auto flex flex-col gap-6">
          {faqsData.map((faq, index) => (
            <motion.div
              key={index}
              layout
              onClick={() => toggleIndex(index)}
              className={`cursor-pointer rounded-lg border border-[#FFFFFF42] overflow-hidden transition-colors duration-300 ${
                activeIndex === index
                  ? "bg-gradient-to-b from-[#1C1F4A] to-[#4B4CFF]"
                  : "bg-[#FFFFFF1A]"
              }`}
            >

              <div className="flex justify-between items-center px-4 md:px-6 py-4 text-[#EAF0FF] font-spaceGrotesk max-md:leading-[20px] text-[18px] md:text-[24px]">
                {faq.question}
                <span className="text-[#9AA4C7] text-[28px]">
                  {activeIndex === index ? "−" : "+"}
                </span>
              </div>


              <AnimatePresence initial={false}>
                {activeIndex === index && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="px-4 md:px-6 pb-6 text-[#9AA4C7] text-[14px] max-md:leading-[18px] md:text-[18px] leading-relaxed"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
      <div className=" absolute left-0  right-0 mx-auto top-[75%] md:bottom-0">
        <Started />
      </div>
    </motion.div>
  );
};

export default Faqs;
