import React from "react";
import Image from "next/image";
import cardbg from "@assets/cardgreenbg.png";
import keyicon from "@assets/keryicon.png";
import pqc from "@assets/pqc.png";
import btmarrow from "@assets/btmarrow.png";
import errorpurple from "@assets/errorpurple.png";
const SystemBtm = () => {
  return (
    <div className="  relative container mt-[50px]">
      <div className="  relative   w-full mx-auto rounded-[20px] border-[#EAF0FF1A] border-[1px] p-[20px]">
        <div className=" max-w-[460px] w-full absolute left-0 right-0 top-[-15px]  rounded-full h-[34px] flex justify-center items-center  mx-auto bg-[#EAF0FF1A] border-[#FFFFFF38] border-[1px]">
          <span className=" text-[#EAF0FF] rounded-full p-[10px]">
            3.3 Payload Layer: Post-Quantum Cryptography (PQC)
          </span>
        </div>


        <div className=" max-w-[800px] flex items-center gap-[10px] w-full mt-[60px] mx-auto">
          <div className=" absolute top-[22%] z-[99] left-[30%]   lg:left-[40%] ">
            <Image src={pqc} alt="pqc" />
          </div>
          <div className=" max-w-[400px] w-full h-full relative">

            <Image
              src={cardbg}
              alt="cardbg"
              fill
              className="object-cover h-full rounded-md"
            />



            <div className="relative items-center flex z-10 py-[20px] ">
              <div>
                <Image src={keyicon} alt="keyicon " />
              </div>
              <div>
                <h3 className="lg:text-sm  text-[10px] font-semibold text-[#EAF0FF]">
                  PQC KEM
                </h3>
                <p className="text-[#EAF0FF] text-[8px] lg:text-[12px]">
                  CRYSTALS-Kyber-1024- session keyestablished
                </p>
              </div>
            </div>
          </div>
          <div>
            <Image src={btmarrow} alt=" btmarrow " />
          </div>
          <div className=" max-w-[400px] w-full ">
            <p className=" max-lg:text-[10px] text-[#EAF0FF] font-spaceGrotesk ">
              Continuous key updates along as timeline
            </p>
            <div className=" max-w-[400px] w-full h-full relative">

              <Image
                src={cardbg}
                alt="cardbg"
                fill
                className="object-cover h-full rounded-md"
              />



              <div className="relative items-center flex z-10 py-[20px] ">
                <div>
                  <Image src={keyicon} alt="keyicon " />
                </div>
                <div>
                  <h3 className="lg:text-sm  text-[10px] font-semibold text-[#EAF0FF]">
                    PQC KEM
                  </h3>
                  <p className="text-[#EAF0FF] text-[8px] lg:text-[12px]">
                    CRYSTALS-Kyber-1024- session keyestablished
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="  max-w-[800px] justify-between flex w-full mx-auto">
          <div className=" max-w-[400px] flex items-center gap-[5px] w-full">
            <Image src={errorpurple} alt="error" />
            <p className=" text-[#EAF0FF] max-lg:text-[10px]">
              Forward Secrecy:{" "}
              <span className=" lg:text-[12px] text-[10px]">
                Past messages safeeven if keys are compromised
              </span>
            </p>
          </div>
          <div className=" max-w-[400px] flex items-center gap-[5px]   w-full">
            <Image src={errorpurple} alt="error" />
            <p className=" text-[#EAF0FF] max-lg:text-[10px]">
              Forward Secrecy:{" "}
              <span className=" lg:text-[12px] text-[10px]">
                Past messages safeeven if keys are compromised
              </span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SystemBtm;
