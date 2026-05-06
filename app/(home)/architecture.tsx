import Image from "next/image";
import systemBtm from "@assets/systembtmimg.png";
import systemStar from "@assets/sysytemStar.png";
import chart from "@assets/chart.svg";
const Architecture = () => {
  return (
    <div className="relative">

      <div id="system " className="absolute  inset-x-0 bottom-0 z-0">
        <Image
          src={systemBtm}
          alt="system bottom"
          className="w-full "
          priority
        />
      </div>
      <div className="absolute  max-w-[1200px] w-full mx-auto z-[-1] inset-x-0 bottom-0 ">
        <Image
          src={systemStar}
          alt="system bottom"
          className=" max-2xl:hidden "
          priority
        />
      </div>
      <div className="  container py-[100px]">
        <div>
          <h2 className="text-[#9AA4C7] mb-[30px] font-spaceGrotesk text-[18px] xl:text-[20px] max-lg:text-center">
            <span>{"// "}</span>
            System Architecture
          </h2>
          <div className=" relative mx-auto w-full p-[50px] rounded-[50px] border-[2px] border-[#EAF0FF1A] bg-[#EAF0FF1A] backdrop-blur-[20px]">
            <Image src={chart} alt="chart" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Architecture;
