import { motion } from "framer-motion";
import CountUp from "@/src/components/countUp";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const StatsSection = () => {
  return (
    <div className="container mx-auto px-4">
      <motion.div
        className="text-white flex flex-col max-md:max-w-[300px] max-md:mx-auto md:flex-row"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >

        <motion.div
          variants={itemVariants}
          className="w-full md:max-w-[400px] md:border-l border-gray-700 p-8 rounded-t md:rounded-l"
        >
          <CountUp target={200} suffix="+" />
          <div className="text-[#9AA4C7] md:text-[20px] max-md:mt-[5px]  text-[14px] max-md:text-center font-spaceGrotesk md:mt-[50px]">
            Key Mutations
            <span className="xl:block">
              per Session
            </span>
          </div>
        </motion.div>


        <motion.div
          variants={itemVariants}
          className="w-full md:max-w-[400px] md:border-l border-gray-700 p-8"
        >
          <CountUp target={10} suffix="+" />
          <div className="text-[#9AA4C7] max-md:mt-[5px]   md:text-[20px] text-[14px] max-md:text-center font-spaceGrotesk md:mt-[50px]">
            Relay Nodes
            <span className="xl:block">
               per Message Path
            </span>
          </div>
        </motion.div>


        <motion.div
          variants={itemVariants}
          className="w-full md:max-w-[400px] md:border-l border-gray-700 p-8 md:rounded-r"
        >
          <CountUp target={1} />
          <div className="text-[#9AA4C7] max-md:mt-[5px]   md:text-[20px] text-[14px] max-md:text-center font-spaceGrotesk md:mt-[50px]">
            Anchor Key
            <span className="xl:block">
              (Never Leaves Device)
            </span>
          </div>
        </motion.div>


        <motion.div
          variants={itemVariants}
          className="w-full md:max-w-[400px]  p-8 md:border-l border-gray-700"
        >
          <CountUp target={0} />
          <div className="text-[#9AA4C7] max-md:mt-[5px] md:text-[20px] text-[14px] max-md:text-center font-spaceGrotesk md:mt-[50px]">
            Recoverable Message
            <span className="xl:block">
              Artifacts
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StatsSection;
