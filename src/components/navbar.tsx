"use client";

import React, { useState } from "react";
import Image from "next/image";
import logo from "@assets/logo.svg";
import { IoIosMenu } from "react-icons/io";
import { FaArrowUp, FaGithub } from "react-icons/fa6";
import { AnimatePresence } from "framer-motion";
import Drawer from "./drawer";
import btnbg from "@assets/btnbg.svg";
import logoSmall from "@assets/mobile/samlllogo.svg";
import Link from "next/link";

interface NavItem {
  label: string;
  id: string;
}

const navItems: NavItem[] = [
  { label: "Overview", id: "overview" },
  { label: "Roadmap", id: "roadmap" },
];

const Navbar: React.FC = () => {
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  const handleScrollTo = (id: string): void => {
    const section: HTMLElement | null = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <div className="container flex items-center justify-between gap-4 py-3 md:py-4">
        <Image src={logo} alt="logo" priority className="max-md:hidden" />
        <Image src={logoSmall} alt="logo" className=" md:hidden" />

        <div className="hidden lg:flex shrink-0 bg-[#EAF0FF1A] border border-[#FFFFFF38] items-center gap-2 xl:gap-3 p-[5px] rounded-full">
          <div className="w-[42px] h-[42px] flex justify-center items-center rounded-full bg-white shrink-0">
            <IoIosMenu className="text-black" />
          </div>

          <div className="flex items-center gap-2 xl:gap-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleScrollTo(item.id)}
                className="shrink-0 text-[14px] h-[42px] px-[17px] flex items-center justify-center rounded-full cursor-pointer text-white bg-[#FFFFFF1A] border border-[#FFFFFF38] whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}

            <Link
              href="/ambassador-program"
              className="shrink-0 text-[14px] h-[42px] px-[17px] flex items-center justify-center rounded-full cursor-pointer text-white bg-[#FFFFFF1A] border border-[#FFFFFF38] whitespace-nowrap"
            >
              Ambassador Program
            </Link>

            <Link
              href="/whitepaper"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[14px] h-[42px] px-[17px] flex items-center justify-center rounded-full cursor-pointer text-white bg-[#FFFFFF1A] border border-[#FFFFFF38] whitespace-nowrap"
            >
              Whitepaper
            </Link>

            <Link
              href="https://github.com/Mutate-Tools"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[14px] h-[42px] px-[17px] flex items-center justify-center rounded-full cursor-pointer text-white bg-[#FFFFFF1A] border border-[#FFFFFF38] whitespace-nowrap"
            >
              <FaGithub className="mr-2" />
              GitHub
            </Link>
          </div>
        </div>

        <div className="bg-[#FFFFFF1A] max-lg:hidden border-[1px] p-[5px] max-w-[204px] w-full rounded-full border-[#FFFFFF38]">
          <Link href="/chat" className="w-full">
            <button className="relative hidden lg:flex items-center w-full justify-center gap-2 rounded-full px-2 py-3 overflow-hidden group">
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
          </Link>
        </div>

        <IoIosMenu
          className="lg:hidden text-white text-3xl cursor-pointer"
          onClick={() => setShowDrawer(true)}
        />
      </div>

      <AnimatePresence>
        {showDrawer && <Drawer setShowDrawer={setShowDrawer} />}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
