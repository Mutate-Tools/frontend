'use client'

import React from 'react';
import Image from 'next/image';
import { FiPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import btnbg from "@assets/loginbg.svg";
import settingIcon from '@assets/settingIcon.png';
import profile from '@assets/profile.png';

interface DappDrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: 'home' | 'raffle';
  setActiveTab: (tab: 'home' | 'raffle') => void;
}

const DappDrawer: React.FC<DappDrawerProps> = ({ open, onClose, activeTab, setActiveTab }) => {

  return (
    <AnimatePresence>
      {open && (
        <>

          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />


          <motion.div
            className="fixed top-0 right-0 w-64 h-full bg-[#0A0910] p-4 flex flex-col gap-6 z-50"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >

            <button
              className="absolute top-4 right-4 text-white text-xl"
              onClick={onClose}
            >
              ✕
            </button>


            <div className="flex justify-center">
              <Image src="/logo.png" alt="Logo" width={120} height={40} />
            </div>


            <button
              className="flex items-center gap-2 text-white rounded-full px-4 h-[40px] font-medium
                         transition hover:scale-[1.02] active:scale-[0.97] bg-center bg-cover"
              style={{ backgroundImage: `url(${btnbg.src})` }}
            >
              <FiPlus size={16} /> Create Chatroom
            </button>

            <button className="flex items-center gap-2 text-white px-4 py-2 border border-white/20 rounded-lg">
              <Image src={settingIcon} alt="Settings" className="w-5 h-5" />
              Settings
            </button>

            <button className="flex items-center gap-2 text-white px-4 py-2 border border-white/20 rounded-lg">
              <Image src={profile} alt="Profile" className="w-8 h-8 rounded-full" />
              Profile
            </button>


            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => { setActiveTab('home'); onClose(); }}
                className={`w-full text-left text-white py-2 px-3 rounded-lg
                  ${activeTab === 'home' ? 'bg-[#FFFFFF1A]' : 'bg-transparent hover:bg-white/10'}`}
              >
                Home
              </button>

              <button
                onClick={() => { setActiveTab('raffle'); onClose(); }}
                className={`w-full text-left text-white py-2 px-3 rounded-lg
                  ${activeTab === 'raffle' ? 'bg-[#FFFFFF1A]' : 'bg-transparent hover:bg-white/10'}`}
              >
                Raffle
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DappDrawer;
