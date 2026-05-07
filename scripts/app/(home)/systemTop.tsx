import Image from "next/image";
import systemBank from "@assets/systembank.png";
import cardbg from "@assets/systemcardbg.png";
import systemcardbg1 from "@assets/systemcardbg1.png";
import headicon from "@assets/headicon.png";
import arrow from "@assets/arrow.png";
import cardbg2 from "@assets/systemcardbg2.png";
import dotedarrow from "@assets/dotedarrow.png";
import bankright from "@assets/bankright.png";
const SystemTop = () => {
  return (
    <div className=" container">

                  <div className="  w-full mx-auto rounded-[20px] border-[#EAF0FF1A] border-[1px] p-[20px]">
                    <div className=" max-w-[350px] w-full absolute left-0 right-0 top-[30px]  rounded-full h-[34px] flex justify-center items-center  mx-auto bg-[#EAF0FF1A] border-[#FFFFFF38] border-[1px]">
                      <span className=" text-[#EAF0FF] rounded-full p-[10px]">
                        3.1 Identity Layer: Ephemeral DID Standard
                      </span>
                    </div>
                    <div className=" flex 2xl:gap-[20px]">
                      <div className=" max-xl:mt-[20px]">
                        <Image src={systemBank} alt="systemMachine" />
                      </div>
                      <div className=" max-xl:max-w-[100px] max-xl:w-full pt-[10px]">
                        <p>
                          <span className=" text-[#EAF0FF] font-bold 2xl:text-[16px] xl:text-[12px]  text-[8px] font-spaceGrotesk">
                            Root Anchor
                          </span>
                          <span className=" xl:text-[12px] text-[8px] text-[#EAF0FF]">- Kroot</span>
                          <span className=" xl:text-[12px] text-[8px] block text-[#EAF0FF]">
                            (BIP-39, never on network)
                          </span>
                        </p>
                      </div>
                      <div className="relative xl:max-w-[200px] max-w-[100px]  w-full">

                        <Image
                          src={cardbg}
                          alt="cardbg"
                          className="xl:w-full xl:min-h-[180px]"
                        />


                        <div className="absolute inset-0 flex flex-col items-center ">
                          <h2 className=" pb-[10px] text-[#EAF0FF] xl:text-[14px] text-[10px] font-spaceGrotesk">
                            Alice’s Client
                          </h2>
                          <div className=" xl:max-w-[142px] max-w-[100px]  bg-[#EAF0FF1A] w-full xl:p-[10px]  rounded-md">
                            <span className=" block text-center text-[#EAF0FF] font-spaceGrotesk text-[8px] xl:text-[12px]">
                              DID_session_1
                              <span className=" block text-center">
                                (Alice ←→ Carol)
                              </span>
                            </span>
                          </div>
                          <div className=" xl:mt-[40px] mt-[10px] xl:max-w-[142px] max-w-[100px] bg-[#EAF0FF1A] w-full xl:p-[10px]  rounded-md">
                            <span className=" block text-center text-[#EAF0FF] font-spaceGrotesk text-[8px] xl:text-[12px]">
                              DID_session_1
                              <span className=" block text-center">
                                (Alice ←→ Carol)
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className=" max-w-[100px] mt-[70px] w-full">
                        <Image src={arrow} alt="arrow" />
                        <span className="text-[#EAF0FF] text-[12px] font-spaceGrotesk mt-[10px] block">
                          Mathematically
                          <span className=" block">Unlink-able</span>
                        </span>
                      </div>

                      <div className="relative xl:max-w-[271px] max-w-[180px] mt-[50px] w-full">

                        <Image
                          src={systemcardbg1}
                          alt="bg"
                          className="w-full min-h-[70px]"
                        />


                        <div className="absolute inset-0 flex  mt-[10px]   xl:gap-6">
                          <div>
                            <Image src={headicon} alt="headicon " />
                          </div>

                          <div>
                            <h3 className="xl:text-[14px] text-[10px] font-semibold text-[#EAF0FF]">
                              ZK-SNARK Handshake
                            </h3>
                            <p className="xl:text-[10px] text-[10px] text-white/80 mt-1">
                              Proves ownership of Kroot without revealing it
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className=" mt-[70px]">
                        <Image src={arrow} alt="arrow" />
                      </div>
                      <div className="relative xl:max-w-[160px] max-w-[100px] w-full mt-[30px]">

                        <Image
                          src={cardbg2}
                          alt="cardbg"
                          className="w-full  min-h-[120px]"
                        />


                        <div className="absolute inset-0 flex flex-col items-center p-3 text-white">
                          <h3 className="xl:text-[14px] text-[10px] font-spaceGrotesk text-[#EAF0FF]">
                            Bob’s Client
                          </h3>
                          <div className=" xl:max-w-[142px] max-w-[100px] pb-[20px] bg-[#EAF0FF1A] w-full xl:p-[10px]  rounded-md">
                            <span className=" block text-center text-[#EAF0FF] font-spaceGrotesk text-[8px] xl:text-[12px]">
                              DID_session_1
                              <span className=" block text-center">(Bob ←→ Alice)</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className=" flex">
                        <div className="mt-[50px]">
                          <Image src={dotedarrow} alt="dotedarrow " />
                        </div>
                        <div>
                          <div>
                            <Image src={bankright} alt="bankright" />
                          </div>
                          <div className="relative max-w-[200px] w-full ">

                            <Image
                              src={cardbg2}
                              alt="cardbg"
                              className="w-full  min-h-[150px]"
                            />


                            <div className="absolute inset-0 flex flex-col items-center p-3 text-white">
                              <div className=" max-w-[142px] pb-[20px] bg-[#EAF0FF1A] w-full p-[3px]  rounded-md">
                                <span className=" block text-center text-[#EAF0FF] font-spaceGrotesk text-[8px] xl:text-[12px]">
                                  Carol’s Client
                                  <span className=" block text-center">
                                    (Unlinkability)
                                  </span>
                                </span>
                              </div>
                              <div className=" max-w-[142px] pb-[20px] bg-[#EAF0FF1A] w-full p-[3px] mt-[10px]  rounded-md">
                                <span className=" block text-center text-[#EAF0FF] font-spaceGrotesk text-[8px] xl:text-[12px]">
                                  Carol’s Client
                                  <span className=" block text-center">
                                    (Unlinkability)
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>


    </div>
  )
}

export default SystemTop
