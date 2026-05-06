"use client";

import React, { useCallback, useState } from "react";
import { FiUsers, FiUserPlus, FiX } from "react-icons/fi";
import FriendsList from "./friendsList";
import AddFriend from "./addFriend";

interface FriendsRailProps {
  
  showCloseButton?: boolean;
  onClose?: () => void;
}

const FriendsRail: React.FC<FriendsRailProps> = ({
  showCloseButton = false,
  onClose,
}) => {
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendCount, setFriendCount] = useState(0);
  const handleCountChange = useCallback((count: number) => {
    setFriendCount(count);
  }, []);

  return (
    <>
      <aside className="flex flex-col h-full w-full lg:w-[280px] bg-white/[0.03] border border-white/10 rounded-[20px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#3730EA]/20 border border-[#3730EA]/40 flex items-center justify-center">
              <FiUsers className="text-[#9DA3FF]" size={14} />
            </div>
            <h2 className="text-white font-semibold text-sm">Friends</h2>
            <span className="min-w-[20px] h-5 rounded-full bg-white/10 text-white/70 text-[10px] font-semibold flex items-center justify-center px-1.5">
              {friendCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAddFriend(true)}
              aria-label="Add friend"
              title="Add friend"
              className="h-8 px-3 rounded-full hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1.5 transition text-xs font-medium"
            >
              <FiUserPlus size={14} />
              <span>Add Friend</span>
            </button>
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition lg:hidden"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll">
          <FriendsList
            onCountChange={handleCountChange}
            onFriendOpen={onClose}
          />
        </div>
      </aside>

      {showAddFriend && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-12 px-4">
          <div className="w-full max-w-[400px]">
            <AddFriend onClose={() => setShowAddFriend(false)} />
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(55, 48, 234, 0.4);
          border-radius: 20px;
        }
      `}</style>
    </>
  );
};

export default FriendsRail;
