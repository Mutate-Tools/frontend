"use client";
import Image from "next/image";
import systemChart from "@assets/mobile/systemChart.svg";
const MobileArchitecture = () => {
  return (
    <section className="container py-[20px] md:py-[100px]">

      <h2 className="text-[#9AA4C7] mb-8 font-spaceGrotesk text-[18px] xl:text-[20px] max-lg:text-center">
        <span>{"// "}</span>System Architecture
      </h2>


      <div className="relative p-[5px] rounded-[20px] border border-[#EAF0FF1A] bg-[#EAF0FF1A] backdrop-blur-[20px]">
        <div className=" max-w-[400px] w-full mx-auto">
          <Image src={systemChart} alt="system" />
        </div>
      </div>
    </section>
  );
};

export default MobileArchitecture;
