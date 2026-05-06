import React from "react";
import alice from "@assets/alice.png";
import Image from "next/image";
import messgeIcon from "@assets/messageicon.png";
import arrowPurple from "@assets/arrowPurple.png";
import hop1 from "@assets/hop1.png";
import singalIcon from "@assets/signalicon.png";
import hop2 from "@assets/hop2.png";
import hop3 from "@assets/hop3.png";
import bob from "@assets/bob.png";
import erroricon from "@assets/erroricon.png";
import doublearrow from "@assets/doublearrow.png";
import trading from "@assets/tradingicon.png";

const SystemMiddle = () => {
  return (
    <div className=" container mt-[50px]">
      <div className="  relative   w-full mx-auto rounded-[20px] border-[#EAF0FF1A] border-[1px] p-[20px]">
        <div className=" max-w-[380px] w-full absolute left-0 right-0 top-[-15px]  rounded-full h-[34px] flex justify-center items-center  mx-auto bg-[#EAF0FF1A] border-[#FFFFFF38] border-[1px]">
          <span className=" text-[#EAF0FF] rounded-full p-[10px]">
            3.2 Transport Layer: Stochastic Relay Network
          </span>
        </div>
        <div className=" max-w-[1200px] mt-[10px] w-full mx-auto">
          <div className=" flex items-center gap-[10px]">
            <div>
              <Image src={alice} alt="alice" />
            </div>
            <div className=" max-lg:mt-[20px]  flex flex-col items-center">
              <div>
                <Image src={messgeIcon} alt="messgeIcon" />
              </div>
              <div className=" lg:my-[8px]">
                <Image src={arrowPurple} alt="arrow" />
              </div>
              <span className=" text-[#EAF0FF] text-[8px] lg:text-[10px] block">
                Onion Encryption
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div>
                <Image src={singalIcon} alt="singalIcon " />
              </div>
              <div>
                <Image src={hop1} alt="hop1" />
              </div>
            </div>

            <div className=" flex flex-col items-center">
              <div>
                <Image src={messgeIcon} alt="messgeIcon" />
              </div>
              <div className=" my-[8px]">
                <Image src={arrowPurple} alt="arrow" />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div>
                <Image src={singalIcon} alt="singalIcon " />
              </div>
              <div>
                <Image src={hop2} alt="hop2" />
              </div>
            </div>
            <div className=" flex flex-col items-center">
              <div>
                <Image src={messgeIcon} alt="messgeIcon" />
              </div>
              <div className=" my-[8px]">
                <Image src={arrowPurple} alt="arrow" />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div>
                <Image src={singalIcon} alt="singalIcon " />
              </div>
              <div>
                <Image src={hop3} alt="hop3" />
              </div>
            </div>
            <div className=" flex flex-col items-center">
              <div>
                <Image src={messgeIcon} alt="messgeIcon" />
              </div>
              <div className=" my-[8px]">
                <Image src={arrowPurple} alt="arrow" />
              </div>
            </div>
            <div>
              <Image src={bob} alt="bob" />
            </div>
          </div>
          <div className=" max-w-[800px] flex justify-between mt-[50px] w-full mx-auto">
            <div className=" max-w-[200px] gap-[10px] flex items-center w-full">
              <div>
                <Image
                  src={erroricon}
                  alt="erroricon "
                  className="  "
                />
              </div>
              <p className=" text-[#EAF0FF] font-spaceGrotesk text-[10px] lg:text-[12px] ">No signal node know both sender and recipient</p>
            </div>
             <div className=" max-w-[200px] gap-[10px] flex items-center w-full">
              <div>
                <Image
                  src={doublearrow}
                  alt="erroricon "
                  className="  "
                />
              </div>
              <p className=" text-[#EAF0FF] font-spaceGrotesk text-[10px] lg:text-[12px] ">No signal node know both sender and recipient</p>
            </div>
             <div className=" max-w-[200px] gap-[10px] flex items-center w-full">
              <div>
                <Image
                  src={trading}
                  alt="erroricon "
                  className="  "
                />
              </div>
              <p className=" text-[#EAF0FF] font-spaceGrotesk text-[10px] lg:text-[12px] ">No signal node know both sender and recipient</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMiddle;
