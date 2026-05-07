"use client";

import { useState } from "react";
import Image from "next/image";
import logo from "@assets/logo.svg";
import TWITTER from "@assets/twitter.svg";
import TG from "@assets/telgram.svg";
import dext from "@assets/dext.svg";
import etherscan from "@assets/etherscan.svg";
import uri from "@/src/constants/external-links";
import Link from "next/link";

const Footer = () => {
  const [copied, setCopied] = useState(false);
  const contractAddress = uri.CONTRACT_ADDRESS.trim();
  const hasContractAddress = contractAddress.length > 0;
  const compactContractAddress = hasContractAddress
    ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-6)}`
    : "";

  const handleScrollTo = (id: string): void => {
    const section: HTMLElement | null = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCopyContract = async (): Promise<void> => {
    if (!hasContractAddress) return;
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy contract address", error);
    }
  };

  return (
    <div className="container flex flex-col gap-10 py-[50px] md:flex-row md:items-start md:justify-between">
      <div className="w-full max-md:mx-auto max-md:flex max-md:flex-col max-md:items-center max-md:justify-center md:max-w-[260px]">
        <div>
          <Image src={logo} alt="logo" />
        </div>
        <span className=" text-white/20 font-spaceGrotesk ">
          Built to mutate. Designed to disappear.
        </span>
        <div className="gap-[10px] mt-[10px] flex">
          <div>
            <Image
              onClick={() => window.open(uri.TWITTER, "_blank")}
              src={TWITTER}
              alt="twitter"
              className="cursor-pointer"
            />
          </div>
          <div>
            <Image
              onClick={() => window.open(uri.TG, "_blank")}
              src={TG}
              alt="twitter"
              className="cursor-pointer"
            />
          </div>
          <div>
            <Image
              onClick={() => window.open(uri.dext, "_blank")}
              src={dext}
              alt="twitter"
              className="cursor-pointer"
            />
          </div>
          <div>
            <Image
              onClick={() => window.open(uri.etherscan, "_blank")}
              src={etherscan}
              alt="twitter"
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>

      {hasContractAddress ? (
        <div className="w-full md:flex md:justify-center md:px-6">
          <button
            type="button"
            onClick={handleCopyContract}
            title={contractAddress}
            className="w-full max-w-[520px] rounded-[22px] border border-[#FFFFFF38] bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] px-4 py-3 text-left transition hover:border-white/40 hover:bg-white/10"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Contract Address
                </span>
                <span className="mt-1 hidden break-all font-spaceGrotesk text-[14px] leading-6 text-white md:block">
                  {contractAddress}
                </span>
                <span className="mt-1 block font-spaceGrotesk text-[14px] text-white md:hidden">
                  {compactContractAddress}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white/70">
                {copied ? "Copied" : "Copy"}
              </span>
            </span>
          </button>
        </div>
      ) : null}

      <div className="flex w-full max-w-[400px] flex-col justify-between max-md:mx-auto md:max-w-[360px] md:flex-row">
        <div className=" max-md:hidden md:max-w-[200px] max-md:mx-auto  w-full">
          <h2 className=" text-[20px]  font-spaceGrotesk text-white max-md:text-center">
            Menu
          </h2>
          <div className=" max-md:flex gap-[10px] flex-wrap justify-center">
            <h5
              onClick={() => {
                handleScrollTo("overview");
              }}
              className=" text-[16px] font-spaceGrotesk  cursor-pointer text-white/20"
            >
              About Us
            </h5>

            <h5
              onClick={() => {
                handleScrollTo("system ");
              }}
              className=" text-[16px] font-spaceGrotesk  cursor-pointer text-white/20"
            >
              System Architecture
            </h5>
            <h5
              onClick={() => {
                handleScrollTo("roadmap");
              }}
              className=" text-[16px] font-spaceGrotesk  cursor-pointer text-white/20"
            >
              Roadmap
            </h5>
          </div>
        </div>
        <div className=" max-w-[180px]  max-lg:mx-auto max-lg:flex flex-col justify-center items-center  max-md:mt-[20px] max-md:mx-auto w-full">
          <h2 className=" text-[20px] mb-[10px] font-spaceGrotesk text-white  max-md:text-center">
            Docs
          </h2>
          <div className="flex flex-col gap-[8px] items-center w-full">
            <Link
              href="conceptpaper"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer w-full px-[10px] text-[14px] text-center text-white border-[#FFFFFF80] border-[1px] rounded-full py-[5px] lg:text-[16px] font-spaceGrotesk hover:text-white transition"
            >
              Concept Paper
            </Link>
            <Link
              href="/whitepaper"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer w-full px-[10px] text-[14px] text-center text-white border-[#FFFFFF80] border-[1px] rounded-full py-[5px] lg:text-[16px] font-spaceGrotesk hover:text-white transition"
            >
              Whitepaper
            </Link>
            <Link
              href="/ambassador-program"
              className="cursor-pointer w-full px-[10px] text-[14px] text-center text-white border-[#3730EA] border-[1px] rounded-full py-[5px] lg:text-[16px] font-spaceGrotesk hover:bg-[#3730EA]/20 transition"
            >
              Ambassador Program
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
