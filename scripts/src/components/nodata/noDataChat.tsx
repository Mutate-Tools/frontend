import Image from "next/image";
import noDataIcon from "@assets/dapp/noChatIcon.svg";

const NoDataChat = () => {
  return (
    <div className="flex flex-col max-lg:hidden items-center  rounded-[30px] 2xl:h-[650px] h-[600px] p-[20px] border-[1px] justify-center w-full max-w-[691px] bg-[#FFFFFF1A] ">
      <div className="flex flex-col items-center gap-4">
        <Image src={noDataIcon} alt="No Data" className="max-w-full" />
        <span className="text-center text-[#EAF0FF4D] text-[14px] font-sora">
          No Chat Selected
        </span>
      </div>
    </div>
  );
};

export default NoDataChat;
