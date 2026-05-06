"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import ChatNavbar from "@/src/components/chatNavbar";
import smallLogo from "@assets/smalllogo.svg";
import DappAnimation from "@/src/components/dappAnimation";
import { useAuth } from "@/src/contexts/AuthContext";
import { useDevice } from "@/src/contexts/DeviceContext";
import { useSubProfile } from "@/src/contexts/SubProfileContext";

const Page = () => {
  const router = useRouter();
  const { isConnected, needsProfileCompletion, profile, loading, error, loginWithIdToken } =
    useAuth();
  const { ready, needsE2EEChoice } = useDevice();
  const { loading: subProfilesLoading } = useSubProfile();

  useEffect(() => {
    if (!isConnected || !profile || !ready || subProfilesLoading) return;
    if (needsProfileCompletion) {
      router.replace("/chat/complete-profile");
      return;
    }
    if (needsE2EEChoice) {
      router.replace("/chat/e2ee-setup");
      return;
    }
    let target = "/chat/inbox";
    try {
      const saved = sessionStorage.getItem("post_login_redirect");
      if (saved && (saved.startsWith("/u/") || saved.startsWith("/g/"))) {
        target = saved;
        sessionStorage.removeItem("post_login_redirect");
      }
    } catch {}
    router.replace(target);
  }, [isConnected, profile, ready, subProfilesLoading, needsProfileCompletion, needsE2EEChoice, router]);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-ChatBg1 max-lg:bg-center bg-no-repeat bg-cover flex flex-col">
      <div className="container mx-auto px-4 flex flex-col flex-1">
        <div className="flex justify-center py-4 lg:hidden">
          <Image src={smallLogo} alt="Mobile Logo" priority />
        </div>
        <div className="hidden lg:block py-[10px] xl:py-[30px]">
          <ChatNavbar />
        </div>

        <div className="max-w-[964px] w-full mx-auto flex flex-col items-center justify-center flex-1 text-center">
          <h2 className="font-spaceGrotesk text-[#EAF0FF] lg:text-[54px] lg:leading-[50px] md:text-[30px] text-[24px] leading-[25px]">
            Secure Conversations and Private Group Messaging in One Place
          </h2>
          <p className="mt-2 md:mt-4 text-[16px] max-md:text-[12px] leading-[18px] md:leading-[20px] font-spaceGrotesk text-[#9AA4C7] max-w-[700px]">
            End-to-end encrypted chat and private groups. Sign in once with Google to start a conversation.
          </p>

          <div className="max-w-[340px] w-full mt-4 xl:mt-8 flex flex-col gap-3 items-center">
            {loading ? (
              <div className="h-[44px] flex items-center text-white/70 text-sm">Connecting…</div>
            ) : (
              <GoogleLogin
                onSuccess={(cred) => {
                  if (cred.credential) loginWithIdToken(cred.credential);
                }}
                onError={() => console.error("[Google] sign-in failed")}
                theme="filled_black"
                shape="pill"
                size="large"
                text="signin_with"
                width="300"
              />
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-center 2xl:pb-6">
        <DappAnimation />
      </div>
    </div>
  );
};

export default Page;
