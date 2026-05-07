"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { FaArrowUp, FaGithub } from "react-icons/fa6";
import Image from "next/image";
import btnbg from "@assets/btnbg.svg";
import Link from "next/link";

interface DrawerProps {
  setShowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavItem {
  label: string;
  id: string;
}

const navItems: NavItem[] = [
  { label: "Overview", id: "overview" },
  { label: "Tokenomics", id: "tokenomics" },
  { label: "Roadmap", id: "roadmap" },
];

const Drawer: React.FC<DrawerProps> = ({ setShowDrawer }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleScrollTo = (id: string) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    setShowDrawer(false);
  };

  return (
    <motion.div
      className=" bg-black "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowDrawer(false)}
    >
      <motion.div
        className="absolute top-0 max-w-[280px] rounded-md right-0 w-full z-200  bg-black  border-l border-white/10 p-4 flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <IoMdClose
            className="text-white text-2xl cursor-pointer"
            onClick={() => setShowDrawer(false)}
          />
        </div>

        <div className="mt-10 flex flex-col gap-5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleScrollTo(item.id)}
              className="h-[42px] py-[10px] px-5 rounded-full  bg-black  text-left text-sm text-white border border-white/30 hover:bg-white/10 transition"
            >
              {item.label}
            </button>
          ))}

          <Link
            href="/ambassador-program"
            className="text-[14px] h-[42px] px-[17px] flex items-center rounded-full cursor-pointer text-white border border-[#FFFFFF38] whitespace-nowrap"
          >
            Ambassador Program
          </Link>

          <Link
            href="/whitepaper"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] h-[42px] px-[17px] flex items-center  rounded-full cursor-pointer text-white border border-[#FFFFFF38] whitespace-nowrap"
          >
            Whitepaper
          </Link>

          <Link
            href="https://github.com/Mutate-Tools"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] h-[42px] px-[17px] flex items-center rounded-full cursor-pointer text-white border border-[#FFFFFF38] whitespace-nowrap"
          >
            <FaGithub className="mr-2" />
            GitHub
          </Link>
        </div>

        <div className="flex-grow" />

        <div className="bg-white/10 mb-[100px] border mt-[30px] border-white/30 p-[5px] rounded-full">
          <Link href="/chat">
            <button className="relative flex items-center justify-center gap-2 w-full rounded-full px-6 py-3 overflow-hidden">
              <Image
                src={btnbg}
                alt="btnbg"
                fill
                priority
                className="object-cover rounded-full"
              />

              <span className="relative text-white">Mutate Your Chat</span>

              <span className="relative rotate-45 text-white">
                <FaArrowUp />
              </span>
            </button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Drawer;
