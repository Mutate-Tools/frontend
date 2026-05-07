import { motion } from "framer-motion";

const Bult = () => {
  return (
    <motion.div
      id="overview"
      className="container py-[50px] flex lg:flex-row flex-col justify-center lg:justify-between"
      initial={{ opacity: 0, y: -60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
      }}
      viewport={{
        once: true,
        amount: 0.3,
      }}
    >
      <div>
        <h2 className="text-[#9AA4C7] font-spaceGrotesk text-[18px] xl:text-[20px] max-lg:text-center">
          <span>{"// "}</span>
          Built to Mutate
        </h2>
      </div>

      <div className="max-w-[1022px] w-full">
        <p className="text-[#EAF0FF] mb-[20px] max-lg:text-center xl:text-[40px] md:text-[30px] text-[18px] font-spaceGrotesk leading-[20px] md:leading-[40px]">
          <span className="text-[#3730EA]">Mutate.tools</span> is a
          privacy-first messaging platform built for the modern internet.
        </p>

        <p className="text-[#EAF0FF] xl:text-[40px] max-lg:text-center md:text-[30px] text-[18px] leading-[20px] font-spaceGrotesk md:leading-[40px]">
          Instead of relying on static identities, we use a dynamic approach
          where identities, encryption keys, and network paths continuously
          change.
        </p>

        <span className="md:text-[20px] max-md:mt-[5px] text-[14px] max-md:leading-[16px] font-spaceGrotesk block max-lg:text-center text-[#9AA4C7]">
          This makes tracking and profiling virtually impossible. Our goal is
          simple: secure communication without permanent digital footprints.
        </span>
      </div>
    </motion.div>
  );
};

export default Bult;
