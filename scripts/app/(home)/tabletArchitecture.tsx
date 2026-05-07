import Image from "next/image";
import tabchart from "@assets/tabchart.svg";

const TabletArchitecture = () => {
  return (
    <section className="container max-md:hidden py-[100px]">

      <h2 className="text-[#9AA4C7] mb-8 font-spaceGrotesk text-[18px] xl:text-[20px] text-center">
        <span>{"// "}</span>
        System Architecture
      </h2>


      <div className="relative max-w-[700px] w-full mx-auto p-[50px] rounded-[50px] border-2 border-[#EAF0FF1A] bg-[#EAF0FF1A] backdrop-blur-[20px] flex justify-center">
        <Image
          src={tabchart}
          alt="System Architecture Chart"
          className="block max-w-full h-auto"
          priority
        />
      </div>
    </section>
  );
};

export default TabletArchitecture;
