"use client";

import { motion } from "framer-motion";
import btnbg from "@assets/btnbg.svg";
import { FaArrowUp } from "react-icons/fa6";
import Image from "next/image";

const Started = () => {
  return (
    <div className="min-h-[500px] relative bg-no-repeat bg-center bg-cover">
      <div className="container">
        <motion.div
          className="w-full text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="text-[#FFFFFF] text-[20px] md:text-[30px] lg:text-[54px]">
          Where identities refuse to stay still.
          </h2>
          <span className="block md:text-[16px] text-[14px] max-md:leading-[18px] text-white/30 mt-2">
            A decentralized messaging network built on continuous identity and route mutation.
          </span>







          <div className=" bg-[#FFFFFF1A] border-[1px] p-[5px] mx-auto mt-[10px] max-w-[254px] w-full rounded-full border-[#FFFFFF38]">
            <button className="relative  flex items-center w-full justify-center gap-2 rounded-full px-6 py-3 overflow-hidden group">

              <Image
                src={btnbg}
                alt="btnbg"
                fill
                priority
                className="object-cover rounded-full"
              />


              <span className="relative z-10 text-white transition-colors duration-300">
                Mutate Your Chat
              </span>

              <span className="relative z-10 rotate-45 text-white">
                <FaArrowUp />
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Started;
