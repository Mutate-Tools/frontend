"use client";
import Image from "next/image";
import secintificicon from "@assets/secintific-icon.svg";
import mutationicon from "@assets/mutation-icon.png";
import routingicon from "@assets/routing-icon.png";
import rotationicon from "@assets/rotation-icon.png";
import cardImg from "@assets/herocardimg.svg";
import shadowbg from "@assets/shadowbg.png";
import shadowIcon from "@assets/shadowicon.svg";
import heroCircle from "@assets/herocircle.png";
import cardimg from "@assets/herocard1.svg";
import { motion } from "framer-motion";
import btnbg from "@assets/herobtnbg.svg";

const Hero = () => {
  const handleVideoReady = () => {

    localStorage.setItem("heroVideoLoaded", "true");
  };
  return (
    <div className="relative">
      <div className=" max-lg:mt-[50px] container overflow-hidden py-[40px]  lg:py-[100px]">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="absolute md:inset-0 max-md:top-[10%] max-sm:top-[-5%] w-full h-full -z-30 flex justify-end"
        >

          <div className="relative w-full max-lg:[500px] max-lg:h-[700px] max-sm:h-[550px] lg:max-w-[1400px] h-full">

            <video
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              onCanPlayThrough={handleVideoReady}
              onError={handleVideoReady}
              className="w-full h-full object-cover"
              style={{
                maskImage:
                  "radial-gradient(ellipse 45% 50% at 60% 40%, black 20%, transparent 70%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 45% 50% at 60% 40%, black 20%, transparent 70%)",
              }}
            >
              <source src="/videos/hero-bg.mp4" type="video/mp4" />
            </video>


            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 55% 60% at 60% 40%, rgba(55,48,234,0.45) 0%, rgba(55,48,234,0.3) 35%, rgba(55,48,234,0.15) 55%, transparent 75%)",
                mixBlendMode: "color",
              }}
            />


            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 50% 55% at 60% 40%, rgba(167,139,250,0.35) 0%, rgba(99,102,241,0.25) 30%, rgba(55,48,234,0.15) 50%, transparent 70%)",
                mixBlendMode: "screen",
              }}
            />


            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 22% 24% at 60% 35%, rgba(255,255,255,0.25) 0%, rgba(161,157,255,0.15) 40%, transparent 70%)",
                mixBlendMode: "overlay",
              }}
            />
          </div>
        </motion.div>

        <div className="flex lg:flex-row flex-col justify-between">
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
            viewport={{ once: true }}
            className=" max-w-[901px] w-full"
          >
            <div className="bg-[#FFFFFF1A] max-md:backdrop-blur-lg max-lg:mx-auto rounded-full flex justify-center items-center p-[5px] max-w-[164px] border-[#FFFFFF38] w-full border-[1px]">
              <Image src={secintificicon} alt="secintificicon" />
              <span className=" text-[#EAF0FF] font-spaceGrotesk text-[14px]">
                Mutate.Tools
              </span>
            </div>

            <h2 className="xl:text-[54px] lg:text-[40px] text-[30px] max-sm:leading-[35px] max-lg:text-center font-spaceGrotesk text-[#EAF0FF]">
              Privacy That Refuses to Stand Still
            </h2>
            <span className=" text-[#EAF0FF] block max-lg:text-center  max-sm:leading-[30px]  xl:text-[54px] lg:text-[40px] text-[30px] font-industrial">
              You can’t track what keeps changing
            </span>
            <div className="flex lg:flex-row flex-col items-center gap-[20px] md:gap-[50px]">
              <div className=" max-w-[462px] w-full">
                <p className=" md:text-[16px] text-[14px] max-lg:text-center max-md:leading-[16px] text-[#9AA4C7]">
                  Mutate.tools is a decentralized messaging network built on
                  moving-target defense.Your identity, encryption keys, and
                  network routes continuously mutate — eliminating static
                  metadata and making surveillance mathematically ineffective.
                </p>
              </div>

              <button className="relative max-w-[204px] max-md:mb-[10px] lg:flex items-center w-full justify-center gap-2 rounded-full px-6 py-3 overflow-hidden group">

                <Image
                  src={btnbg}
                  alt="btnbg"
                  fill
                  priority
                  className="object-cover rounded-full"
                />


                <span className="relative z-10 text-white transition-colors duration-300">
                  Buy Now
                </span>




              </button>









            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            viewport={{ once: true }}
            className=" max-lg:mx-auto max-w-[280px] w-full"
          >
            <h2 className=" text-[#EAF0FF] max-md:mb-[5px] max-lg:text-center font-spaceGrotesk text-[16px] xl:text-[20px]">
              Explore Micro level Data
            </h2>
            <div className=" flex items-center justify-between">
              <div className=" flex gap-[5px]">
                <div className="relative max-w-[86.29032135009766px] border-[1px]  backdrop-blur-3xl  border-[#FFFFFF38] w-full h-[104.83870697021484px] bg-[#FFFFFF1A] rounded-lg">



                  <div className="relative flex flex-col items-center justify-center w-full h-full">
                    <Image src={mutationicon} alt="icon" />
                    <span className="text-[12px] text-[#EAF0FF] text-center block font-spaceGrotesk">
                      Identity Mutation
                    </span>
                  </div>
                </div>
                <div className="relative max-w-[86.29032135009766px] border-[1px]  backdrop-blur-3xl  border-[#FFFFFF38] w-full h-[104.83870697021484px] bg-[#FFFFFF1A] rounded-lg">



                  <div className="relative flex flex-col items-center justify-center w-full h-full">
                    <Image src={routingicon} alt="icon" />
                    <span className="text-[12px] text-[#EAF0FF] text-center block font-spaceGrotesk">
                      Mixnet Routing
                    </span>
                  </div>
                </div>
                <div className="relative max-w-[86.29032135009766px] border-[1px]   border-[#FFFFFF38] w-full h-[104.83870697021484px] bg-[#FFFFFF1A] rounded-lg">



                  <div className="relative flex flex-col items-center justify-center w-full h-full">
                    <Image src={rotationicon} alt="icon" />
                    <span className="text-[12px] text-[#EAF0FF] text-center block font-spaceGrotesk">
                      Key Rotation
                    </span>
                  </div>
                </div>
              </div>




            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
          viewport={{ once: true }}
          className=" pt-[20px] flex lg:flex-row flex-col   gap-[50px]"
        >
          <div className=" flex sm:flex-row flex-col max-sm:justify-center items-center  sm:items-end gap-[50px]">
            <div className=" max-w-[334px] mt-[50px] bg-[#0A0910] w-full">
              <div>
                <Image src={cardImg} alt="cardimg" />
              </div>
              <div className=" max-md:p-[10px] max-md:mt-[10px]">
                <h2 className=" md:my-[10px] my-[5px] xl:text-[20px] text-[18px] text-[#EAF0FF] font-spaceGrotesk">
                  Disposable Identities
                </h2>
                <p className=" text-[#9AA4C7] md:text-[16px] text-[14px] max-md:leading-[16px] xl:leading-[17px] font-spaceGrotesk">
                  Each conversation operates under a unique public identity.No
                  correlation. No long-term fingerprint.
                </p>
              </div>
            </div>
            <div className="relative max-w-[350px] w-full">

              <Image
                src={shadowbg}
                alt="shadow background"
                className="w-full lg:min-h-[280px] min-h-[180px] xl:min-h-[220px]"
                priority
              />


              <div className="absolute inset-0 xl:p-3 p-5 flex flex-col">

                <div className="mb-4 flex h-10 w-10 items-center justify-center ">
                  <Image src={shadowIcon} alt="icon" />
                </div>


                <h3 className="text-[#EAF0FF] xl:text-[20px] text-[18px] ">
                  Non-Deterministic Routing
                </h3>


                <p className="mt-2 xl:text-[16px] max-md:text-[14px]  max-md:leading-[16px] text-[#9AA4C7] xl:leading-[17px]">
                  Messages never travel the same path twice. Traffic analysis
                  becomes useless.
                </p>
              </div>
            </div>
          </div>

          <div className=" flex  sm:flex-row flex-col   items-center gap-[50px]">
            <div>
              <Image src={heroCircle} alt="heroCircle" />
            </div>
            <div className=" max-w-[334px] mt-[50px] p-[20px] bg-[#FFFFFF1A] rounded-[30px] border-[1px] border-[#FFFFFF38]  w-full">
              <h2 className=" md:my-[10px] text-[18px] xl:text-[20px] text-[#EAF0FF] font-spaceGrotesk">
                Irreversible Deletion
              </h2>
              <p className=" text-[#9AA4C7] text-[14px]  max-md:mb-[10px] max-md:leading-[16px] md:text-[16px] xl:leading-[17px] font-spaceGrotesk">
                Deleted messages are overwritten at the memory level.Recovery is
                physically impossible.
              </p>

              <div>
                <Image src={cardimg} alt="cardimg" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
