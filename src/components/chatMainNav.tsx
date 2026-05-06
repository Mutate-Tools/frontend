"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiChevronDown, FiLogOut, FiBell, FiUserPlus } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import btnbg from "@assets/loginbg.svg";
import logo from "@assets/logo.svg";
import defaultlogo from "@assets/dapp/defaultlogo.svg";
import mobilelogo from "@assets/mobile/samlllogo.svg";
import ManageProfile from "./manageProfile";
import CreateGroup from "./createGroup";
import NotificationInbox from "./notificationInbox";
import useUserStore from "../state/user-store";
import env from "../constants/environment";
import { useAuth } from "../contexts/AuthContext";
import { useSubProfile } from "../contexts/SubProfileContext";
import { useRouter } from "next/navigation";
import { getBackendUrl } from '@/src/utils/backend-url';


const processedRealtimeNotificationIds = new Set<string>();

const rememberRealtimeNotification = (notif: any) => {
  const key =
    String(notif?.notificationId || "") ||
    [
      notif?.type || "notification",
      notif?.relatedUserHash || "",
      notif?.actionData?.requestId || "",
    ].join(":");
  if (!key || processedRealtimeNotificationIds.has(key)) return false;
  processedRealtimeNotificationIds.add(key);
  if (processedRealtimeNotificationIds.size > 120) {
    const first = processedRealtimeNotificationIds.values().next().value;
    if (first) processedRealtimeNotificationIds.delete(first);
  }
  return true;
};

const isDesktopViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches;

const ChatMainNav = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [manageProfileOpen, setManageProfileOpen] = useState(false);
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { activeTab, setActiveTab } = useUserStore();
  const { profile, token, disconnect } = useAuth();
  const { activeSubProfile } = useSubProfile();
  const router = useRouter();

  
  useEffect(() => {
    if (!token || !activeSubProfile?.identityHash) return;
    const fetchUnread = async () => {
      try {
        const res = await axios.get(
          `${getBackendUrl()}/notifications?unread_only=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Identity-Hash": activeSubProfile.identityHash,
            },
          }
        );
        setUnreadCount(res.data?.length || 0);
      } catch (err) {
        
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [token, activeSubProfile?.identityHash]);

  
  useEffect(() => {
    const handleNew = (event: any) => {
      const notif = event.detail;
      if (!notif) return;
      if (!rememberRealtimeNotification(notif)) return;

      setUnreadCount((prev) => prev + 1);
      if (!isDesktopViewport()) return;

      const ad = notif.actionData || {};
      if (notif.type === "friend_request") {
        const senderName = ad.senderName || "Someone";
        toast.custom(
          (t) => (
            <div
              style={{
                opacity: t.visible ? 1 : 0,
                transform: t.visible
                  ? "translateY(0) scale(1)"
                  : "translateY(-10px) scale(0.96)",
                transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className="pointer-events-auto bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#3730EA]/40 shadow-2xl rounded-xl px-4 py-3 flex items-center gap-3 max-w-sm"
            >
              <div className="w-9 h-9 rounded-full bg-[#3730EA]/30 border border-[#3730EA]/50 flex items-center justify-center text-white">
                <FiUserPlus size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {senderName} sent a friend request
                </p>
                <p className="text-white/50 text-xs">Tap the bell to respond</p>
              </div>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  setShowNotifications(true);
                }}
                className="text-[10px] px-3 py-1.5 rounded-full bg-[#3730EA] hover:bg-[#4B45F0] text-white font-semibold transition"
              >
                View
              </button>
            </div>
          ),
          { duration: 5000, position: "top-right" }
        );
      }
    };
    const handleRemoved = () =>
      setUnreadCount((prev) => Math.max(0, prev - 1));
    const handleReadAll = () => setUnreadCount(0);

    window.addEventListener("friend:notification:new", handleNew);
    window.addEventListener("friend:notification:removed", handleRemoved);
    window.addEventListener("friend:notifications:read-all", handleReadAll);
    return () => {
      window.removeEventListener("friend:notification:new", handleNew);
      window.removeEventListener("friend:notification:removed", handleRemoved);
      window.removeEventListener("friend:notifications:read-all", handleReadAll);
    };
  }, []);

  if (createGroupModal) {
    return <CreateGroup onBack={() => setCreateGroupModal(false)} />;
  }

  const avatarSrc =
    profile?.avatarUrl ||
    (profile && env.GROUP_AVATARS?.[profile.avatarId ?? 0]) ||
    defaultlogo;

  const handleLogout = () => {
    disconnect();
    router.replace("/chat");
  };

  return (
    <>
      {manageProfileOpen && (
        <ManageProfile onClose={() => setManageProfileOpen(false)} />
      )}

      <NotificationInbox
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          setUnreadCount(0);
        }}
      />

      <nav className="lg:container mx-auto flex items-center justify-between py-[10px] lg:py-4 lg:px-4 border-b border-white/10 relative z-30">
        <Image
          src={logo}
          alt="Logo"
          width={140}
          height={40}
          priority
          className="max-lg:hidden"
        />
        <Image src={mobilelogo} alt="logo" className="lg:hidden" />

        <div className="hidden lg:flex items-center bg-[#EAF0FF1A] p-[5px] rounded-full gap-1 absolute left-[40%] xl:left-[50%] -translate-x-1/2">
          {(["home", "raffle"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-[8px] rounded-full transition ${
                activeTab === tab
                  ? "bg-white/10 border-[1px] border-white/40 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab === "home" ? "Home" : "Referrals"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <button
            onClick={() => setCreateGroupModal(true)}
            className="flex items-center max-lg:hidden gap-2 px-2 xl:px-6 h-[50px] text-white rounded-full bg-center bg-cover"
            style={{ backgroundImage: `url(${btnbg.src})` }}
          >
            <FiPlus size={18} />
            Create Chatroom
          </button>

          <button
            onClick={() => {
              setShowNotifications(true);
              setUnreadCount(0);
            }}
            aria-label="Notifications"
            className="relative pl-2 sm:pl-4 border-l border-[#2A2F55]"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition">
              <FiBell className="text-white" size={16} />
            </div>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-semibold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              data-profile-toggle
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-3"
            >
              <div className="relative w-[30px] h-[30px] rounded-full overflow-hidden">
                <Image src={avatarSrc} alt="Profile" fill className="object-cover" unoptimized={!!profile?.avatarUrl} />
              </div>
              <div className="text-left leading-tight">
                <p className="text-white text-sm">{profile?.username ?? ""}</p>
              </div>
              <FiChevronDown
                className={`text-white transition ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  className="absolute right-0 mt-3 z-50 min-w-[180px] rounded-xl border border-white/10 bg-[#0d1020]/95 backdrop-blur p-2"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setManageProfileOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-white/10 rounded-md"
                  >
                    Edit profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-300 hover:bg-white/10 rounded-md"
                  >
                    <FiLogOut /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </>
  );
};

export default ChatMainNav;
