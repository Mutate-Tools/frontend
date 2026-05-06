"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { ChatProvider } from "@/src/contexts/ChatContext";
import { SubProfileProvider } from "@/src/contexts/SubProfileContext";
import { DeviceProvider } from "@/src/contexts/DeviceContext";

export function Providers({
  children,
  googleClientId,
}: {
  children: ReactNode;
  googleClientId: string;
}) {

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <SubProfileProvider>
          <DeviceProvider>
            <ChatProvider>{children}</ChatProvider>
          </DeviceProvider>
        </SubProfileProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
