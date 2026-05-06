'use client';

import { Dispatch, ReactNode, SetStateAction } from 'react';
import Image from 'next/image';
import homeicon from "@assets/dapp/homeicon.svg";
import raffleicon from "@assets/dapp/raffleicon.svg";
import settingicon from "@assets/dapp/settingicon.svg";
import { FiUsers } from "react-icons/fi";
import { useChatStore } from '../state/chat-store';

export type MobileTabId = 'home' | 'friends' | 'raffle' | 'settings';

interface MobileTabProps {
  activeTab: MobileTabId;
  setActiveTab: Dispatch<SetStateAction<MobileTabId>>;
}

interface Tab {
  id: MobileTabId;
  label: string;
  icon?: any;
  iconNode?: ReactNode;
}

const MobileTab = ({ activeTab, setActiveTab }: MobileTabProps) => {
  const { activeInbox } = useChatStore();

  const tabs: Tab[] = [
    { id: 'home', label: 'Home', icon: homeicon },
    { id: 'friends', label: 'Friends', iconNode: <FiUsers size={24} /> },
    { id: 'raffle', label: 'Referrals', icon: raffleicon },
    { id: 'settings', label: 'Profile & Settings', icon: settingicon },
  ];

  return (
    <div className={`${activeInbox ? "max-lg:hidden" : ""}  fixed bottom-0 left-0 w-full px-2 pb-2`}>
      <div className="flex justify-between  bg-[#FFFFFF1A] border border-white/20 p-[4px] sm:p-[8px] rounded-full font-sora">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-[5px] sm:py-2 rounded-full transition
              ${activeTab === tab.id ? 'bg-[#FFFFFF1A]' : ''}`}
          >
            {tab.icon ? (
              <Image src={tab.icon} alt={tab.label} width={24} height={24} />
            ) : (
              <span className={activeTab === tab.id ? "text-[#EAF0FF]" : "text-white/20"}>
                {tab.iconNode}
              </span>
            )}
            <span className={`md:text-xs text-[7px] mt-1 max-w-full truncate ${activeTab === tab.id ? 'text-[#EAF0FF]' : 'text-white/20'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileTab;
