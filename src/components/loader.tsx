'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import logo from '@assets/loaderlogo.svg';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50  flex items-center justify-center bg-[#06060C] overflow-hidden">


      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(96,88,255,0.35)_0%,_rgba(6,6,12,0.95)_35%)]" />


      <motion.div
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[200px] h-[200px] p-[20px] rounded-full bg-[#0B1020]
                   flex items-center justify-center
                   shadow-[0_0_60px_18px_rgba(96,88,255,0.35)]"
      >
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="origin-center"
        >
          <Image src={logo} alt="logo" className=' w-[100px] h-[100px]' />
        </motion.div>
      </motion.div>


      <div className="absolute bottom-[22%] w-[100px] overflow-hidden flex justify-center">
        <motion.div
          className="flex gap-8 text-white text-[22px] font-medium"
          initial={{ x: 100 }}
          animate={{ x: -100 }}
          transition={{
            duration: 0.8,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          <span className="opacity-30">100</span>
          <span className="opacity-50">75</span>
          <span className="opacity-100">50</span>
          <span className="opacity-50">25</span>
          <span className="opacity-30">1</span>
        </motion.div>
      </div>
    </div>
  );
};

export default Loader;
