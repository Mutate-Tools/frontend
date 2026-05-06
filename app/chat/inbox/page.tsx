"use client";

import InboxHome from "@/app/inbox/inboxHome";
import Loader from "@/src/components/loader";
import InboxRefer from "@/app/inbox/inboxRefer";
import { useAuth } from "@/src/contexts/AuthContext";
import useUserStore from "@/src/state/user-store";

export default function InboxPage() {
  const { profile, isConnected } = useAuth();
  const { activeTab } = useUserStore();

  if (!isConnected || !profile) return <Loader />;
  return (
    <div className="container mx-auto px-4">
      {activeTab === "home" && <InboxHome />}
      {activeTab === "raffle" && <InboxRefer />}
    </div>
  );
}
