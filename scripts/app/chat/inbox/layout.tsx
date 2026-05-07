'use client';

import { useEffect, useState } from 'react';
import ChatMainNav from "@/src/components/chatMainNav";
import MobileTab, { MobileTabId } from "@/src/components/mobileTab";
import MobileProfile from "@/src/components/mobileProfile";
import FriendsRail from "@/src/components/friendsRail";
import InboxRefer from '@/app/inbox/inboxRefer';
import InboxHome from '@/app/inbox/inboxHome';
import { useRouter } from 'next/navigation';
import Loader from '@/src/components/loader';
import { useChatStore } from '@/src/state/chat-store';
import { useAuth } from '@/src/contexts/AuthContext';
import { useDevice } from '@/src/contexts/DeviceContext';
import { useSubProfile } from '@/src/contexts/SubProfileContext';

export default function InboxLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<MobileTabId>('home');
  const router = useRouter();
  const { activeInbox } = useChatStore();
  const { isConnected, profile, needsProfileCompletion, loading: authLoading } = useAuth();
  const { ready, needsE2EEChoice } = useDevice();
  const { loading: subProfilesLoading } = useSubProfile();
  const isProfileOpen = activeTab === 'settings';
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <InboxHome />;
      case 'friends':
        return (
          <div className="p-3 pb-28">
            <div className="mb-3">
              <ChatMainNav />
            </div>
            <div className="h-[calc(100dvh-150px)]">
              <FriendsRail onClose={() => setActiveTab('home')} />
            </div>
          </div>
        );
      case 'raffle':
        return <InboxRefer />;
      case 'settings':
        return <MobileProfile />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isConnected) {
      router.replace("/chat");
      return;
    }
    if (!ready || subProfilesLoading) return;
    if (profile && needsProfileCompletion) {
      router.replace("/chat/complete-profile");
      return;
    }
    if (profile && needsE2EEChoice) {
      router.replace("/chat/e2ee-setup");
    }
  }, [authLoading, isConnected, profile, ready, subProfilesLoading, needsProfileCompletion, needsE2EEChoice, router]);

  if (authLoading) return <Loader />;
  if (!isConnected || !profile) return <Loader />;
  if (!ready || subProfilesLoading) return <Loader />;
  if (needsProfileCompletion) return <Loader />;
  if (needsE2EEChoice) return <Loader />;

  return (
    <div className="min-h-[100dvh] bg-InboxBg bg-cover bg-no-repeat relative">


      <div className="max-lg:hidden container mx-auto">
        <ChatMainNav />
        <div className="mt-4">

          <div className="mt-4">{children}</div>
        </div>
      </div>


      <div className="lg:hidden relative flex flex-col min-h-[100dvh]">


        {!isProfileOpen && (
          <div className="fixed top-0 left-0 w-full z-50">

          </div>
        )}


        <div className={`flex-1 ${activeInbox ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {renderContent()}
        </div>


        {!activeInbox && <MobileTab activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>
    </div>
  );
}
