import Image from "next/image";
import { motion } from "framer-motion";
import bulb from "@assets/tokenomicsbulb.png";
import bulb2 from "@assets/roadmapbulb.png";
import tokenomicsLayer from "@assets/tokenomicslayer.png";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: -40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const Tokenomics = () => {
  return (
    <div className="relative">
      <div id="tokenomics" className="relative min-h-screen bg-TokenomicsBg bg-no-repeat bg-center bg-cover">

        <div className="absolute top-[-60%] right-0 w-full z-[-1]">
          <Image src={bulb} alt="bulb" />
        </div>
        <Image src={bulb2} alt="bulb" className="absolute w-full h-full z-[-1] top-[-50%] left-0" />
        <Image src={bulb2} alt="bulb" className="absolute w-full h-full top-[-40%] z-[-1] left-0" />

        <div className="container px-4">

          <h2 className="text-[#9AA4C7] font-spaceGrotesk text-[18px] max-lg:text-center xl:text-[20px]">
            <span>{"// "}</span> Tokenomics
          </h2>


          <motion.div
            className="flex flex-wrap justify-between my-[50px] pb-[100px] gap-4 items-stretch"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >

            <motion.div variants={cardVariants} className="flex-1 min-w-[200px] rounded-lg border-[1px] border-[#FFFFFF38] bg-[#FFFFFF1A] backdrop-blur-3xl p-4 md:p-[10px] h-[119px] flex flex-col justify-center">
              <span className="text-[#EAF0FF] text-[40px] font-spaceGrotesk rounded-md block">$XX</span>
              <span className="block font-spaceGrotesk text-[#9AA4C7] mt-2">Liquidity</span>
            </motion.div>


            <motion.div variants={cardVariants} className="flex-1 min-w-[200px] rounded-lg border-[1px] border-[#FFFFFF38] bg-[#FFFFFF1A] backdrop-blur-3xl p-4 md:p-[10px] lg:mt-[50px] min-h-[119px] flex flex-col justify-center">
              <span className="text-[#EAF0FF] text-[40px] font-spaceGrotesk rounded-md block">$XX</span>
              <span className="block font-spaceGrotesk text-[#9AA4C7] mt-2">Liquidity</span>
            </motion.div>


            <motion.div variants={cardVariants} className="flex-1 min-w-[200px] rounded-lg border-[1px] border-[#FFFFFF38] bg-[#FFFFFF1A] backdrop-blur-3xl p-4 md:p-[10px] h-[119px] flex flex-col justify-center">
              <span className="text-[#EAF0FF] text-[40px] font-spaceGrotesk rounded-md block">$XX</span>
              <span className="block font-spaceGrotesk text-[#9AA4C7] mt-2">Liquidity</span>
            </motion.div>


            <motion.div variants={cardVariants} className="flex-1 min-w-[200px] rounded-lg border-[1px] border-[#FFFFFF38] bg-[#FFFFFF1A] backdrop-blur-3xl p-4 md:p-[10px] lg:mt-[50px] min-h-[119px] flex flex-col justify-center">
              <span className="text-[#EAF0FF] text-[40px] font-spaceGrotesk rounded-md block">$XX</span>
              <span className="block font-spaceGrotesk text-[#9AA4C7] mt-2">Liquidity</span>
            </motion.div>
          </motion.div>
        </div>
      </div>


      <div className="absolute bottom-[-140px] min-h-[300px] w-full">
        <Image src={tokenomicsLayer} alt="layer" className="w-full h-[300px]" />
      </div>
    </div>
  );
};

export default Tokenomics;
