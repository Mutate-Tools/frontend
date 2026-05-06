"use client";

import { useState } from "react";
import btnbg from "@assets/loginbg.svg";
import { FiPlus } from "react-icons/fi";
import InboxContent from "./inboxContent";
import GroupContent from "./groupContent";
import ChatMainNav from "./chatMainNav";
import CreateGroup from "./createGroup";
import ProfileSwitcher from "./profileSwitcher";
import { useChatStore } from "../state/chat-store";

const InboxLeft = () => {
  const [activeTab, setActiveTab] = useState<"inbox" | "groups">("inbox");
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const { activeInbox } = useChatStore();

  if (createGroupModal) {
    return <CreateGroup onBack={() => setCreateGroupModal(false)} />;
  }

  return (
    <div className={`${activeInbox && "max-lg:hidden"}`}>
      <div className="lg:hidden px-[10px] mb-[10px]">
        <ChatMainNav />
      </div>
      <div className="xl:max-w-[345px] max-lg:max-w-[345px] max-lg:mx-auto lg:max-w-[250px] w-full relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-white text-[14px] xl:text-[24px] font-spaceGrotesk">
              Inbox
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ProfileSwitcher />

            <button
              onClick={() => setCreateGroupModal(true)}
              className="flex lg:hidden items-center gap-2 text-[10px] px-[10px] xl:px-6 text-white rounded-full h-[30px] xl:h-[40px] transition hover:scale-[1.02] active:scale-[0.97] bg-center bg-cover"
              style={{ backgroundImage: `url(${btnbg.src})` }}
            >
              <FiPlus size={10} />
              Create Chatroom
            </button>
          </div>
        </div>

        <div className="mt-4 h-[47px] rounded-[30px] mb-[10px] p-[5px] border border-[#EAF0FF1A] flex">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`w-1/2 h-full rounded-[25px] text-[12px] xl:text-sm font-medium transition
            ${
              activeTab === "inbox"
                ? "bg-[#3730EA] text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.55),inset_0_2px_6px_rgba(255,255,255,0.35)]"
                : "text-[#FFFFFFBF]"
            }`}
          >
            Inbox
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`w-1/2 h-full rounded-[25px] text-[12px] xl:text-sm font-medium transition
            ${
              activeTab === "groups"
                ? "bg-[#3730EA] text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.55),inset_0_2px_6px_rgba(255,255,255,0.35)]"
                : "text-[#FFFFFFBF]"
            }`}
          >
            Groups
          </button>
        </div>

        {activeTab === "inbox" ? <InboxContent /> : <GroupContent />}
      </div>
    </div>
  );
};

export default InboxLeft;
